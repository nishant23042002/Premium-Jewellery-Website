export interface AddressSnapshot {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  skuCode?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  isMadeToOrder: boolean;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  note?: string;
  byAdminName?: string;
  at: string;
}

export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

export interface OrderPayment {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  method?: string;
  amount: number;
  currency: string;
  verifiedAt?: string;
  /** Set once a real Razorpay refund succeeds (see order.actions.ts :: refundOrder) — never set just because the order's `status` field says "refunded"/"cancelled". */
  refundId?: string;
  refundedAt?: string;
}

export type OrderStatus =
  | "payment_received"
  | "confirmed"
  | "waiting_for_production"
  | "in_production"
  | "quality_check"
  | "packed"
  | "ready_to_dispatch"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderPricing {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  grandTotal: number;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  customerId: string;
  customerSnapshot: { name: string; email: string; phone?: string };
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  items: OrderItem[];
  pricing: OrderPricing;
  couponCode?: string;
  payment: OrderPayment;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryEntry[];
  trackingNumber?: string;
  courier?: string;
  createdAt: string;
  updatedAt: string;
}

/** Whether an order needs the longer made-to-order status chain vs the shorter ready-stock chain — derived, never stored separately. */
export function isMadeToOrderOrder(order: Pick<Order, "items">): boolean {
  return order.items.some((item) => item.isMadeToOrder);
}
