import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const wishlistItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const wishlistSchema = new Schema(
  {
    tenantId: tenantField,
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "CustomerAccount",
      required: true,
    },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true },
);

// One wishlist per customer — upsert-on-write, not a growing collection.
wishlistSchema.index({ tenantId: 1, customerId: 1 }, { unique: true });

export type WishlistDocument = InferSchemaType<typeof wishlistSchema>;

export const WishlistModel: Model<WishlistDocument> =
  models.Wishlist ?? model<WishlistDocument>("Wishlist", wishlistSchema);
