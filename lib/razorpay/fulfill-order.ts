import "server-only";
import type { ClientSession } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { logger } from "@/lib/logger";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { OrderModel } from "@/features/orders/order.model";
import { CartModel } from "@/features/cart/cart.model";
import { CustomerAccountModel } from "@/features/customer-auth/customer-account.model";
import { ProductModel } from "@/features/products/product.model";
import { getProductsByIds } from "@/features/products/product.actions";
import type { AddressSnapshot } from "@/features/orders/order.types";

export interface FulfillOrderInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  customerId: string;
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
}

export type FulfillOrderResult =
  | { status: "created"; orderId: string; orderNumber: string }
  | { status: "already_exists"; orderId: string; orderNumber: string }
  | { status: "error"; error: string };

/**
 * The one place an Order document is ever created — shared by the
 * client-side /api/razorpay/verify callback and the /api/razorpay/webhook
 * fallback, so a payment confirmed either way goes through identical logic
 * (same pricing snapshot, same inventory decrement, same cart clear, same
 * idempotency guard). Each caller is responsible for its OWN authentication
 * before calling this — verify checks the order_id|payment_id HMAC against
 * the client-supplied signature, the webhook checks the raw-body HMAC
 * against `X-Razorpay-Signature` — this function trusts that's already done
 * and only does the database work.
 */
export async function fulfillOrderFromPayment({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  customerId,
  shippingAddress,
  billingAddress,
}: FulfillOrderInput): Promise<FulfillOrderResult> {
  const mongoose = await connectToDatabase();

  const existingOrder = await OrderModel.findOne({
    "payment.razorpayOrderId": razorpayOrderId,
  }).lean();
  if (existingOrder) {
    // Fires on: verify + webhook both landing, webhook retried by Razorpay,
    // or the verify callback firing twice (network retry, double-click).
    return {
      status: "already_exists",
      orderId: String(existingOrder._id),
      orderNumber: existingOrder.orderNumber,
    };
  }

  const dbSession = await mongoose.startSession();
  try {
    let createdOrderId: string | null = null;
    let createdOrderNumber: string | null = null;

    await dbSession.withTransaction(async () => {
      const cart = await CartModel.findOne({
        tenantId: DEFAULT_TENANT_ID,
        customerId,
      }).session(dbSession);

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      const customer = await CustomerAccountModel.findById(customerId).session(
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
            logger.warn("fulfillOrderFromPayment", "oversold on paid order", {
              productId: product.id,
              orderCustomerId: customerId,
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
            customerId,
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
        { tenantId: DEFAULT_TENANT_ID, customerId },
        { $set: { items: [] } },
        { session: dbSession },
      );

      createdOrderId = String(order._id);
      createdOrderNumber = order.orderNumber;
    });

    if (!createdOrderId || !createdOrderNumber) {
      throw new Error("Order transaction completed without producing an order");
    }

    return {
      status: "created",
      orderId: createdOrderId,
      orderNumber: createdOrderNumber,
    };
  } catch (error) {
    logger.error("fulfillOrderFromPayment", "order creation transaction failed", {
      error,
      customerId,
      razorpayOrderId,
    });
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
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
