import "server-only";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer-session";
import { getServerEnv } from "@/config/env";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logger } from "@/lib/logger";
import { fulfillOrderFromPayment } from "@/lib/razorpay/fulfill-order";
import {
  addressSnapshotSchema,
  verifyRazorpayPaymentSchema,
} from "@/features/orders/order.schema";

const verifyRequestSchema = verifyRazorpayPaymentSchema.extend({
  shippingAddress: addressSnapshotSchema,
  billingAddress: addressSnapshotSchema,
});

/**
 * The client-side confirmation path: fires right after Razorpay's
 * checkout.js reports success in the browser. Verifies the payment
 * signature server-side (the actual security boundary — the frontend
 * callback is never trusted on its own), then hands off to
 * `fulfillOrderFromPayment` for the actual order creation. If this callback
 * never fires (closed tab, crashed browser, network drop after payment),
 * /api/razorpay/webhook is the fallback that reaches the same function.
 */
export async function POST(request: Request) {
  let session;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(`razorpay-verify:${session.sub}`, {
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

  const result = await fulfillOrderFromPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    customerId: session.sub,
    shippingAddress,
    billingAddress,
  });

  if (result.status === "error") {
    logger.error("razorpay/verify", "fulfillment failed", {
      error: result.error,
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
  }

  return NextResponse.json({
    orderId: result.orderId,
    orderNumber: result.orderNumber,
  });
}
