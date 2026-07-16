import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const searchQuerySchema = new Schema(
  {
    tenantId: tenantField,
    // Normalized (trimmed, lowercased) — the raw query text is never stored
    // separately, so "Gold Ring" and "gold ring" count toward the same entry.
    query: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    // Incremented only on hits where listProducts found nothing — a
    // subset of `count`, not a separate search stream. Surfaces which
    // searches are consistently going unanswered (see
    // analytics.actions.ts's getZeroResultSearchInsights).
    zeroResultCount: { type: Number, required: true, default: 0 },
    lastSearchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

searchQuerySchema.index({ tenantId: 1, query: 1 }, { unique: true });
searchQuerySchema.index({ tenantId: 1, count: -1 });
searchQuerySchema.index({ tenantId: 1, zeroResultCount: -1 });

export type SearchQueryDocument = InferSchemaType<typeof searchQuerySchema>;

export const SearchQueryModel: Model<SearchQueryDocument> =
  models.SearchQuery ??
  model<SearchQueryDocument>("SearchQuery", searchQuerySchema);
