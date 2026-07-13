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
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

customerAccountSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export type CustomerAccountDocument = InferSchemaType<
  typeof customerAccountSchema
>;

export const CustomerAccountModel: Model<CustomerAccountDocument> =
  models.CustomerAccount ??
  model<CustomerAccountDocument>("CustomerAccount", customerAccountSchema);
