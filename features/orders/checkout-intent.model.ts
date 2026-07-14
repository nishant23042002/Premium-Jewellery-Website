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

/**
 * Bridges the gap between "Razorpay order created" and "app Order document
 * created" — the Order model only ever represents a confirmed, paid order
 * (nothing elsewhere in the app expects to see an unpaid Order), so the
 * checkout context (shipping/billing address) that the client-side /verify
 * callback normally supplies has to live somewhere reachable by the
 * webhook too, in case that callback never fires. Written by /create-order,
 * read by both /verify and /webhook, and naturally cleaned up by the TTL
 * index below once the order settles (or the customer abandons checkout).
 */
const checkoutIntentSchema = new Schema(
  {
    tenantId: tenantField,
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "CustomerAccount",
      required: true,
    },
    razorpayOrderId: { type: String, required: true },
    email: { type: String, required: true },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    billingAddress: { type: addressSnapshotSchema, required: true },
  },
  { timestamps: true },
);

checkoutIntentSchema.index({ razorpayOrderId: 1 }, { unique: true });
// Abandoned checkouts (Razorpay order created, payment never completed)
// clean themselves up after 24h — well past Razorpay's own order expiry.
checkoutIntentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export type CheckoutIntentDocument = InferSchemaType<
  typeof checkoutIntentSchema
>;

export const CheckoutIntentModel: Model<CheckoutIntentDocument> =
  models.CheckoutIntent ??
  model<CheckoutIntentDocument>("CheckoutIntent", checkoutIntentSchema);
