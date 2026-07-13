import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const enquirySchema = new Schema(
  {
    tenantId: tenantField,
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    source: {
      type: String,
      enum: ["whatsapp", "form", "call_request"],
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

enquirySchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export type EnquiryDocument = InferSchemaType<typeof enquirySchema>;

export const EnquiryModel: Model<EnquiryDocument> =
  models.Enquiry ?? model<EnquiryDocument>("Enquiry", enquirySchema);
