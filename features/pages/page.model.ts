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

const cmsPageSchema = new Schema(
  {
    tenantId: tenantField,
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: localizedTextSchema(), required: true },
    content: { type: localizedTextSchema(), required: true },
    isPublished: { type: Boolean, default: false },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);

cmsPageSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export type CmsPageDocument = InferSchemaType<typeof cmsPageSchema>;

export const CmsPageModel: Model<CmsPageDocument> =
  models.CmsPage ?? model<CmsPageDocument>("CmsPage", cmsPageSchema);
