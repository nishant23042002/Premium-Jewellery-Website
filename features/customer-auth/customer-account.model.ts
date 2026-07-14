import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const addressSchema = new Schema(
  {
    label: { type: String, trim: true, default: "Home" },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const customerAccountSchema = new Schema(
  {
    tenantId: tenantField,
    email: { type: String, required: true, trim: true, lowercase: true },
    // Optional — Google-only accounts (authProvider: "google") never set
    // this until the customer chooses to add a password via the reset-
    // password flow. Every login path must guard for its absence.
    passwordHash: { type: String, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
    // Google's stable per-account "sub" claim — most accounts (password
    // signups) never have one.
    googleId: { type: String, trim: true },
    // Records how the account was first created; doesn't restrict which
    // methods can be used afterward (a Google signup can still add a
    // password later, and vice versa via account linking).
    authProvider: {
      type: String,
      enum: ["password", "google"],
      default: "password",
    },
  },
  { timestamps: true },
);

customerAccountSchema.index({ tenantId: 1, email: 1 }, { unique: true });
// A plain `sparse: true` compound index only excludes documents missing
// EVERY indexed field — since tenantId is always present, that would index
// every password-only account under `googleId: null` and collide on the
// second one. partialFilterExpression is the correct MongoDB pattern for
// "unique only among documents that actually have this field".
customerAccountSchema.index(
  { tenantId: 1, googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $exists: true } } },
);

export type CustomerAccountDocument = InferSchemaType<
  typeof customerAccountSchema
>;

export const CustomerAccountModel: Model<CustomerAccountDocument> =
  models.CustomerAccount ??
  model<CustomerAccountDocument>("CustomerAccount", customerAccountSchema);
