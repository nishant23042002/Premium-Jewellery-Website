import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const siteSettingSchema = new Schema(
  {
    tenantId: tenantField,
    key: { type: String, required: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

siteSettingSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export type SiteSettingDocument = InferSchemaType<typeof siteSettingSchema>;

export const SiteSettingModel: Model<SiteSettingDocument> =
  models.SiteSetting ??
  model<SiteSettingDocument>("SiteSetting", siteSettingSchema);
