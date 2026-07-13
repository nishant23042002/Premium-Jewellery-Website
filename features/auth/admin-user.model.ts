import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const adminUserSchema = new Schema(
  {
    tenantId: tenantField,
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["owner", "staff"], default: "staff" },
    roleSlug: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

adminUserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema>;

export const AdminUserModel: Model<AdminUserDocument> =
  models.AdminUser ?? model<AdminUserDocument>("AdminUser", adminUserSchema);
