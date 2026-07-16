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
    // Set only via the explicit "Link Google Account" flow while already
    // signed in (features/auth/auth.actions.ts's linkAdminGoogleAccount) —
    // never auto-linked by matching email like the customer-side Google
    // flow does. Login-by-Google looks up this field only, never falls
    // back to email, so an attacker controlling a Google account with an
    // admin's email address (e.g. a compromised mail provider) still can't
    // sign in as that admin without the admin having deliberately linked
    // this Google identity themselves first.
    googleId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

adminUserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema>;

export const AdminUserModel: Model<AdminUserDocument> =
  models.AdminUser ?? model<AdminUserDocument>("AdminUser", adminUserSchema);
