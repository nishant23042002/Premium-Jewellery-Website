import type { OrderStatus } from "@/features/orders/order.types";

/** Human-readable labels shared by the customer order-tracking view and the admin orders dashboard. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  payment_received: "Payment Received",
  confirmed: "Order Confirmed",
  waiting_for_production: "Waiting for Production",
  in_production: "In Production",
  quality_check: "Quality Check",
  packed: "Packed",
  ready_to_dispatch: "Ready to Dispatch",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Ready-stock orders skip the production-specific steps entirely. */
export const READY_STOCK_STATUS_CHAIN: OrderStatus[] = [
  "payment_received",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

export const MADE_TO_ORDER_STATUS_CHAIN: OrderStatus[] = [
  "payment_received",
  "confirmed",
  "waiting_for_production",
  "in_production",
  "quality_check",
  "packed",
  "ready_to_dispatch",
  "shipped",
  "delivered",
];

/** Valid next steps per current status, keyed by chain — powers the admin status-update buttons (only forward + cancel/refund, never an arbitrary jump). */
export function getNextStatuses(
  currentStatus: OrderStatus,
  isMadeToOrder: boolean,
): OrderStatus[] {
  if (
    currentStatus === "cancelled" ||
    currentStatus === "delivered" ||
    currentStatus === "refunded"
  ) {
    return currentStatus === "delivered" ? ["refunded"] : [];
  }

  const chain = isMadeToOrder
    ? MADE_TO_ORDER_STATUS_CHAIN
    : READY_STOCK_STATUS_CHAIN;
  const currentIndex = chain.indexOf(currentStatus);
  const next: OrderStatus[] = [];

  if (currentIndex !== -1 && currentIndex < chain.length - 1) {
    next.push(chain[currentIndex + 1]);
  }
  // Cancellation is only offered before the order ships — once it's shipped, refund is the remaining path.
  if (currentStatus === "shipped") {
    next.push("refunded");
  } else if (currentIndex !== -1 && currentIndex < chain.indexOf("shipped")) {
    next.push("cancelled");
  }

  return next;
}
