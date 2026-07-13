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

const galleryImageSchema = new Schema(
  {
    tenantId: tenantField,
    imageUrl: { type: String, required: true },
    caption: { type: localizedTextSchema(false) },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);

galleryImageSchema.index({ tenantId: 1, sortOrder: 1 });

export type GalleryImageDocument = InferSchemaType<typeof galleryImageSchema>;

export const GalleryImageModel: Model<GalleryImageDocument> =
  models.GalleryImage ??
  model<GalleryImageDocument>("GalleryImage", galleryImageSchema);
