import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import {
  deletedAtField,
  localizedTextSchema,
  tenantField,
} from "@/lib/db/schema-helpers";

const stylingStorySchema = new Schema(
  {
    tenantId: tenantField,
    title: { type: localizedTextSchema(), required: true },
    subtitle: { type: localizedTextSchema(false) },
    coverImageUrl: { type: String, required: true },
    /** Optional — when set, the storefront card plays this instead of the cover image (which stays required as the fallback/poster). */
    videoUrl: { type: String },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);
stylingStorySchema.index({ tenantId: 1, sortOrder: 1 });

export type StylingStoryDocument = InferSchemaType<typeof stylingStorySchema>;

export const StylingStoryModel: Model<StylingStoryDocument> =
  models.StylingStory ??
  model<StylingStoryDocument>("StylingStory", stylingStorySchema);
