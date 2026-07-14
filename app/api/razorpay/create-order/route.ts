import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer-session";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { getCartSummary } from "@/features/cart/cart.actions";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logger } from "@/lib/logger";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { CheckoutIntentModel } from "@/features/orders/checkout-intent.model";
import { createRazorpayOrderSchema } from "@/features/orders/order.schema";

/**
 * Creates a Razorpay order sized from the customer's CURRENT cart, computed
 * server-side — the client only supplies address/contact details, never an
 * amount. This is the only place a Razorpay order gets created; the actual
 * app Order document isn't created here (that only happens after the
 * payment signature is verified in /api/razorpay/verify, or reconciled by
 * /api/razorpay/webhook if that callback never fires).
 *
 * The shipping/billing address supplied here is also stashed in
 * CheckoutIntentModel, keyed by this Razorpay order id — the webhook fallback
 * has no other way to know where to ship an order it's reconciling, since
 * that context otherwise only exists in the client's /verify request body.
 */
export async function POST(request: Request) {
  let session;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(`razorpay-create-order:${session.sub}`, {
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts, please wait a moment" },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createRazorpayOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid checkout details",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const summary = await getCartSummary();
  if (summary.lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  }
  if (summary.unavailableProductIds.length > 0) {
    return NextResponse.json(
      {
        error:
          "Some items in your cart are no longer available — please review your cart",
      },
      { status: 400 },
    );
  }

  // Razorpay amounts are in the smallest currency unit (paise for INR).
  const amountInPaise = Math.round(summary.grandTotal * 100);

  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      // Razorpay caps `receipt` at 40 chars — a full ObjectId + full
      // timestamp overflows that, so this uses only the last 8 hex chars
      // of the customer id + a base36 timestamp. It's just a merchant-side
      // reference label, not an identifier Razorpay relies on for anything.
      receipt: `rcpt_${session.sub.slice(-8)}_${Date.now().toString(36)}`,
      notes: { customerId: session.sub, email: parsed.data.email },
    });

    await connectToDatabase();
    await CheckoutIntentModel.create({
      tenantId: DEFAULT_TENANT_ID,
      customerId: session.sub,
      razorpayOrderId: order.id,
      email: parsed.data.email,
      shippingAddress: parsed.data.shippingAddress,
      billingAddress: parsed.data.billingAddress,
    });

    return NextResponse.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    logger.error("razorpay/create-order", "Failed to create Razorpay order", {
      error,
    });
    return NextResponse.json(
      { error: "Couldn't start payment. Please try again." },
      { status: 502 },
    );
  }
}
