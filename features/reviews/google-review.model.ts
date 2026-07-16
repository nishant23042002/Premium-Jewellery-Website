import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const googleReviewItemSchema = new Schema(
  {
    authorName: { type: String, required: true },
    profilePhotoUrl: { type: String },
    rating: { type: Number, required: true },
    text: { type: String, required: true },
    relativeTimeDescription: { type: String, required: true },
    time: { type: Number, required: true },
  },
  { _id: false },
);

/**
 * One document per tenant — the last successfully fetched batch from the
 * Google Places API. Persisted (not just in-memory/`unstable_cache`) so a
 * future API failure or revoked key still has something durable to fall
 * back to across cold starts/deployments, per getGoogleReviews's contract.
 */
const googleReviewCacheSchema = new Schema(
  {
    tenantId: tenantField,
    reviews: { type: [googleReviewItemSchema], default: [] },
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

googleReviewCacheSchema.index({ tenantId: 1 }, { unique: true });

export type GoogleReviewCacheDocument = InferSchemaType<
  typeof googleReviewCacheSchema
>;

export const GoogleReviewCacheModel: Model<GoogleReviewCacheDocument> =
  models.GoogleReviewCache ??
  model<GoogleReviewCacheDocument>("GoogleReviewCache", googleReviewCacheSchema);
