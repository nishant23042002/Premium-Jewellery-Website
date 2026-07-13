import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const mediaAssetSchema = new Schema(
  {
    tenantId: tenantField,
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    fileName: { type: String },
    uploadedByAdminId: { type: String, required: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

mediaAssetSchema.index({ tenantId: 1, createdAt: -1 });

export type MediaAssetDocument = InferSchemaType<typeof mediaAssetSchema>;

export const MediaAssetModel: Model<MediaAssetDocument> =
  models.MediaAsset ??
  model<MediaAssetDocument>("MediaAsset", mediaAssetSchema);
