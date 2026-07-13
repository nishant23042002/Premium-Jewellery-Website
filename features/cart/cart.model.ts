import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// Deliberately NO price field on cart items — this codebase never persists
// price (see lib/pricing/calculate-price.ts), since gold/silver rates move
// daily and a stored cart price would go stale the moment rates change.
// Price is always computed live from the current MetalRate, same as every
// other price shown on the storefront. Orders (created only after payment)
// DO snapshot the paid price, since historical orders must stay accurate
// even if today's rate later changes — that's a different, correct case.
const cartSchema = new Schema(
  {
    tenantId: tenantField,
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "CustomerAccount",
      required: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

// One cart per customer — upsert-on-write, not a growing collection.
cartSchema.index({ tenantId: 1, customerId: 1 }, { unique: true });

export type CartDocument = InferSchemaType<typeof cartSchema>;

export const CartModel: Model<CartDocument> =
  models.Cart ?? model<CartDocument>("Cart", cartSchema);
