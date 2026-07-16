import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

/**
 * Admin-side twin of features/customer-auth/password-reset-token.model.ts —
 * same reasoning applies verbatim (hash-only storage, TTL index, single-use
 * delete on redemption), kept as a separate collection/model rather than a
 * shared one so a customer token can never be replayed against an admin
 * account or vice versa.
 */
const adminPasswordResetTokenSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

adminPasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AdminPasswordResetTokenDocument = InferSchemaType<
  typeof adminPasswordResetTokenSchema
>;

export const AdminPasswordResetTokenModel: Model<AdminPasswordResetTokenDocument> =
  models.AdminPasswordResetToken ??
  model<AdminPasswordResetTokenDocument>(
    "AdminPasswordResetToken",
    adminPasswordResetTokenSchema,
  );
