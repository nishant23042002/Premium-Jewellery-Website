import "server-only";
import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/env";
import { connectToDatabase } from "@/lib/db/mongoose";
import { logger } from "@/lib/logger";
import { fulfillOrderFromPayment } from "@/lib/razorpay/fulfill-order";
import { CheckoutIntentModel } from "@/features/orders/checkout-intent.model";
import { logSystemAudit } from "@/features/audit-logs/audit-log.actions";
import type { AddressSnapshot } from "@/features/orders/order.types";

/**
 * Server-to-server fallback for the client-side /api/razorpay/verify
 * callback — catches the case where a customer's payment is captured by
 * Razorpay but their browser never reports back (closed tab, crashed app,
 * network drop right after paying). Without this, that money would be
 * captured with no order ever created and no trace of it anywhere in the
 * app. Configure this URL + a secret in the Razorpay dashboard (Settings >
 * Webhooks), subscribed to payment.captured and payment.failed, and set
 * RAZORPAY_WEBHOOK_SECRET to match — the route 503s until that's done, it
 * never silently no-ops on unverified requests.
 *
 * Authenticated by Razorpay's own webhook signature scheme (HMAC-SHA256 of
 * the raw request body, keyed by the webhook secret) — a completely
 * separate trust boundary from the order_id|payment_id signature /verify
 * checks, since this is a different Razorpay feature with its own secret.
 */
export async function POST(request: Request) {
  const { RAZORPAY_WEBHOOK_SECRET } = getServerEnv();
  if (!RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (
    !signature ||
    !Razorpay.validateWebhookSignature(
      rawBody,
      signature,
      RAZORPAY_WEBHOOK_SECRET,
    )
  ) {
    logger.warn("razorpay/webhook", "signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event as string;

  await connectToDatabase();

  if (event === "payment.captured") {
    return handlePaymentCaptured(payload);
  }

  if (event === "payment.failed") {
    const payment = payload.payload?.payment?.entity;
    logger.warn("razorpay/webhook", "payment failed", {
      razorpayOrderId: payment?.order_id,
      errorDescription: payment?.error_description,
    });
    return NextResponse.json({ received: true });
  }

  // Other subscribed-or-not events (refund.processed, etc.) — acknowledged
  // so Razorpay doesn't retry, not acted on. Refund confirmation is
  // synchronous via the admin "Refund" action for now (see order.actions.ts
  // :: refundOrder), so there's nothing to reconcile here yet.
  return NextResponse.json({ received: true });
}

async function handlePaymentCaptured(
  payload: Record<string, unknown>,
): Promise<NextResponse> {
  type PayloadShape = {
    payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
  };
  const payment = (payload as PayloadShape).payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  const razorpayPaymentId = payment?.id;

  if (!razorpayOrderId || !razorpayPaymentId) {
    logger.error("razorpay/webhook", "payment.captured missing order/payment id", {
      payload,
    });
    return NextResponse.json({ received: true });
  }

  const intent = await CheckoutIntentModel.findOne({ razorpayOrderId }).lean();
  if (!intent) {
    // The one case this can't recover from — create-order's CheckoutIntent
    // write failed after the Razorpay order itself succeeded (see the
    // comment in app/api/razorpay/create-order/route.ts). Logged loudly
    // since there's no shipping address to fulfill against; needs a human
    // to reconcile against the Razorpay dashboard.
    logger.error(
      "razorpay/webhook",
      "payment captured with no matching checkout intent — cannot fulfill",
      { razorpayOrderId, razorpayPaymentId },
    );
    return NextResponse.json({ received: true });
  }

  const result = await fulfillOrderFromPayment({
    razorpayOrderId,
    razorpayPaymentId,
    customerId: String(intent.customerId),
    shippingAddress: intent.shippingAddress as AddressSnapshot,
    billingAddress: intent.billingAddress as AddressSnapshot,
  });

  if (result.status === "error") {
    logger.error("razorpay/webhook", "fulfillment failed", {
      error: result.error,
      razorpayOrderId,
    });
    // Non-2xx so Razorpay retries — fulfillOrderFromPayment is idempotent,
    // so a retry either finishes the job or safely no-ops if it already did.
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  if (result.status === "created") {
    logSystemAudit(
      "created_via_webhook",
      "order",
      result.orderId,
      result.orderNumber,
      { razorpayOrderId, reason: "verify callback never arrived" },
    );
  }

  return NextResponse.json({ received: true });
}
