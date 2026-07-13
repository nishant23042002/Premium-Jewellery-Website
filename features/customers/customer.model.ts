import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const customerSchema = new Schema(
  {
    tenantId: tenantField,
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    tags: { type: [String], default: [] },
    notes: { type: String },
    totalReservations: { type: Number, default: 0 },
    totalEnquiries: { type: Number, default: 0 },
    lastContactAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

customerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

export type CustomerDocument = InferSchemaType<typeof customerSchema>;

export const CustomerModel: Model<CustomerDocument> =
  models.Customer ?? model<CustomerDocument>("Customer", customerSchema);
