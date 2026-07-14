import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

/**
 * Stores only a SHA-256 hash of the reset token, never the raw value — the
 * raw token only ever exists in the emailed link and the request body of
 * `resetPasswordAction`, so a database read (backup leak, admin query, etc.)
 * can't be turned into a usable reset link. TTL index expires unused tokens
 * after 1 hour; a used token is deleted immediately by `resetPasswordAction`
 * (single-use, not just time-limited).
 */
const passwordResetTokenSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "CustomerAccount",
      required: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenDocument = InferSchemaType<
  typeof passwordResetTokenSchema
>;

export const PasswordResetTokenModel: Model<PasswordResetTokenDocument> =
  models.PasswordResetToken ??
  model<PasswordResetTokenDocument>(
    "PasswordResetToken",
    passwordResetTokenSchema,
  );
