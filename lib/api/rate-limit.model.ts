import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

/**
 * Pure infra state, not tenant business data — deliberately has no
 * `tenantId` (the `key` string itself already encodes whatever identity
 * matters: an IP, an email, a customer id). TTL index cleans up expired
 * windows on its own; see checkRateLimit() for why a document surviving
 * past `resetAt` for a few seconds before the TTL sweep runs is harmless.
 */
const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  resetAt: { type: Date, required: true },
});

rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitDocument = InferSchemaType<typeof rateLimitSchema>;

export const RateLimitModel: Model<RateLimitDocument> =
  models.RateLimit ?? model<RateLimitDocument>("RateLimit", rateLimitSchema);
