import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const addressSnapshotSchema = new Schema(
  {
    label: { type: String },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String },
  },
  { _id: false },
);

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    // Snapshotted at order time — historical orders must stay accurate even
    // if the product is later renamed, re-priced, or deleted.
    name: { type: String, required: true },
    slug: { type: String, required: true },
    skuCode: { type: String },
    imageUrl: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    isMadeToOrder: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const orderStatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    byAdminName: { type: String },
    at: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },
    method: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    verifiedAt: { type: Date },
    refundId: { type: String },
    refundedAt: { type: Date },
  },
  { _id: false },
);

// Ready-stock: payment_received -> confirmed -> packed -> shipped -> delivered (+ cancelled/refunded).
// Made-to-order: payment_received -> confirmed -> waiting_for_production ->
//   in_production -> quality_check -> packed -> ready_to_dispatch -> shipped
//   -> delivered (+ cancelled/refunded). Which chain applies is derived from
// `items.some(i => i.isMadeToOrder)`, not stored separately — see
// components/admin/order-status-actions.tsx for the transition map.
const ORDER_STATUSES = [
  "payment_received",
  "confirmed",
  "waiting_for_production",
  "in_production",
  "quality_check",
  "packed",
  "ready_to_dispatch",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const orderSchema = new Schema(
  {
    tenantId: tenantField,
    orderNumber: { type: String, required: true, trim: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "CustomerAccount",
      required: true,
    },
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
    },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    billingAddress: { type: addressSnapshotSchema, required: true },
    items: { type: [orderItemSchema], default: [] },
    pricing: {
      subtotal: { type: Number, required: true },
      shipping: { type: Number, required: true, default: 0 },
      tax: { type: Number, required: true },
      discount: { type: Number, required: true, default: 0 },
      grandTotal: { type: Number, required: true },
    },
    couponCode: { type: String },
    payment: { type: paymentSchema, required: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "payment_received",
    },
    statusHistory: { type: [orderStatusHistorySchema], default: [] },
    trackingNumber: { type: String },
    courier: { type: String },
  },
  { timestamps: true },
);

orderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });
orderSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ "payment.razorpayOrderId": 1 }, { unique: true });
orderSchema.index(
  { "payment.razorpayPaymentId": 1 },
  { unique: true, sparse: true },
);

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const OrderModel: Model<OrderDocument> =
  models.Order ?? model<OrderDocument>("Order", orderSchema);
