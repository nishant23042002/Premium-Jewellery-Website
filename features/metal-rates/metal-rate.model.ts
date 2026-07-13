import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const metalRateSchema = new Schema(
  {
    tenantId: tenantField,
    metalType: { type: String, enum: ["gold", "silver"], required: true },
    purity: { type: String, required: true, trim: true },
    ratePerGram: { type: Number, required: true, min: 0 },
    effectiveDate: { type: Date, required: true, default: () => new Date() },
    setByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Audit trail of every rate change (PRD §17 — price-affecting actions must
// be traceable), plus fast lookup of "today's" rate per metal/purity.
metalRateSchema.index({
  tenantId: 1,
  metalType: 1,
  purity: 1,
  effectiveDate: -1,
});

export type MetalRateDocument = InferSchemaType<typeof metalRateSchema>;

export const MetalRateModel: Model<MetalRateDocument> =
  models.MetalRate ?? model<MetalRateDocument>("MetalRate", metalRateSchema);
