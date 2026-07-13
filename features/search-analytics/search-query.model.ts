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
    lastSearchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

searchQuerySchema.index({ tenantId: 1, query: 1 }, { unique: true });
searchQuerySchema.index({ tenantId: 1, count: -1 });

export type SearchQueryDocument = InferSchemaType<typeof searchQuerySchema>;

export const SearchQueryModel: Model<SearchQueryDocument> =
  models.SearchQuery ??
  model<SearchQueryDocument>("SearchQuery", searchQuerySchema);
