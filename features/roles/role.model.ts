import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const roleSchema = new Schema(
  {
    tenantId: tenantField,
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

roleSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export type RoleDocument = InferSchemaType<typeof roleSchema>;

export const RoleModel: Model<RoleDocument> =
  models.Role ?? model<RoleDocument>("Role", roleSchema);
