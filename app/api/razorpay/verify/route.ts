import "server-only";
import crypto from "crypto";
import type { ClientSession } from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireCustomer } from "@/lib/auth/customer-session";
import { getServerEnv } from "@/config/env";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logger } from "@/lib/logger";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { OrderModel } from "@/features/orders/order.model";
import { CartModel } from "@/features/cart/cart.model";
import { CustomerAccountModel } from "@/features/customer-auth/customer-account.model";
import { ProductModel } from "@/features/products/product.model";
import { getProductsByIds } from "@/features/products/product.actions";
import {
  addressSnapshotSchema,
  verifyRazorpayPaymentSchema,
} from "@/features/orders/order.schema";

const verifyRequestSchema = verifyRazorpayPaymentSchema.extend({
  shippingAddress: addressSnapshotSchema,
  billingAddress: addressSnapshotSchema,
});

/**
 * The ONLY place an Order document is ever created. Signature verification
 * happens here, server-side, using the Razorpay key secret — the frontend
 * callback firing "payment success" is never trusted on its own (per the
 * spec: "Never create an order before successful payment verification").
 * Order creation + cart clearing + inventory decrement run inside a single
 * Mongo transaction so a mid-write failure can't leave a paid-for order
 * half-created or a cart cleared without an order to show for it.
 */
export async function POST(request: Request) {
  let session;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`razorpay-verify:${session.sub}`, {
    limit: 20,
    windowMs: 15 * 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts, please wait a moment" },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = verifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payment verification request",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
    shippingAddress,
    billingAddress,
  } = parsed.data;

  // --- The entire security boundary of this payment flow ---
  const { RAZORPAY_KEY_SECRET } = getServerEnv();
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    logger.warn("razorpay/verify", "signature mismatch", {
      customerId: session.sub,
      razorpayOrderId,
    });
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 400 },
    );
  }
  // --- End security boundary — everything below only runs for a genuinely verified payment ---

  const mongoose = await connectToDatabase();

  const existingOrder = await OrderModel.findOne({
    "payment.razorpayOrderId": razorpayOrderId,
  }).lean();
  if (existingOrder) {
    // Verify callback fired twice (network retry, double-click) — return
    // the existing order instead of erroring or creating a duplicate.
    return NextResponse.json({
      orderId: String(existingOrder._id),
      orderNumber: existingOrder.orderNumber,
    });
  }

  const dbSession = await mongoose.startSession();
  try {
    let createdOrderId: string | null = null;
    let createdOrderNumber: string | null = null;

    await dbSession.withTransaction(async () => {
      const cart = await CartModel.findOne({
        tenantId: DEFAULT_TENANT_ID,
        customerId: session.sub,
      }).session(dbSession);

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      const customer = await CustomerAccountModel.findById(session.sub).session(
        dbSession,
      );
      if (!customer) {
        throw new Error("Customer not found");
      }

      const productIds = cart.items.map((item) => String(item.productId));
      const priced = await getProductsByIds(productIds);
      const priceByProductId = new Map(priced.map((p) => [p.product.id, p]));

      const items = [];
      let subtotal = 0;
      let tax = 0;

      for (const cartItem of cart.items) {
        const match = priceByProductId.get(String(cartItem.productId));
        if (!match) continue; // unavailable since cart was priced client-side — skip, don't fail the whole paid order
        const { product, price } = match;

        items.push({
          productId: product.id,
          name: product.name.en,
          slug: product.slug,
          skuCode: product.skuCode,
          imageUrl: product.images[0]?.url,
          quantity: cartItem.quantity,
          unitPrice: price.total,
          isMadeToOrder: product.availability === "made_to_order",
        });

        subtotal += (price.metalValue + price.makingCharge) * cartItem.quantity;
        tax += price.gstAmount * cartItem.quantity;

        // Ready-stock only — made-to-order products never deduct quantity
        // (tracked via order/production status instead, per the spec).
        // The `quantity: { $gte }` guard prevents going negative under a
        // race; if it doesn't match (already sold out), the order still
        // completes since the payment already succeeded — we log it for
        // manual follow-up rather than blocking a paid order.
        if (product.availability !== "made_to_order") {
          const decremented = await ProductModel.findOneAndUpdate(
            { _id: product.id, quantity: { $gte: cartItem.quantity } },
            { $inc: { quantity: -cartItem.quantity } },
            { session: dbSession },
          );
          if (!decremented) {
            logger.warn("razorpay/verify", "oversold on paid order", {
              productId: product.id,
              orderCustomerId: session.sub,
            });
          }
        }
      }

      if (items.length === 0) {
        throw new Error("No purchasable items in cart");
      }

      const grandTotal = round2(subtotal + tax);
      const orderNumber = await generateOrderNumberWithinTransaction(dbSession);

      const [order] = await OrderModel.create(
        [
          {
            tenantId: DEFAULT_TENANT_ID,
            orderNumber,
            customerId: session.sub,
            customerSnapshot: {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            },
            shippingAddress,
            billingAddress,
            items,
            pricing: {
              subtotal: round2(subtotal),
              shipping: 0,
              tax: round2(tax),
              discount: 0,
              grandTotal,
            },
            payment: {
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature,
              status: "paid",
              amount: grandTotal,
              currency: "INR",
              verifiedAt: new Date(),
            },
            status: "payment_received",
            statusHistory: [{ status: "payment_received", at: new Date() }],
          },
        ],
        { session: dbSession },
      );

      await CartModel.updateOne(
        { tenantId: DEFAULT_TENANT_ID, customerId: session.sub },
        { $set: { items: [] } },
        { session: dbSession },
      );

      createdOrderId = String(order._id);
      createdOrderNumber = order.orderNumber;
    });

    if (!createdOrderId || !createdOrderNumber) {
      throw new Error("Order transaction completed without producing an order");
    }

    return NextResponse.json({
      orderId: createdOrderId,
      orderNumber: createdOrderNumber,
    });
  } catch (error) {
    logger.error("razorpay/verify", "order creation transaction failed", {
      error,
      customerId: session.sub,
      razorpayOrderId,
    });
    return NextResponse.json(
      {
        error:
          "Payment was verified but we couldn't finalize your order. Please contact support.",
      },
      { status: 500 },
    );
  } finally {
    await dbSession.endSession();
  }
}

async function generateOrderNumberWithinTransaction(
  dbSession: ClientSession,
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await OrderModel.countDocuments({
    tenantId: DEFAULT_TENANT_ID,
    orderNumber: { $regex: `^AJ-${year}-` },
  }).session(dbSession);
  return `AJ-${year}-${String(count + 1).padStart(5, "0")}`;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
