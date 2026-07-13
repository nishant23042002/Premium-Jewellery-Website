import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import {
  deletedAtField,
  localizedTextSchema,
  tenantField,
} from "@/lib/db/schema-helpers";

const offerSchema = new Schema(
  {
    tenantId: tenantField,
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: localizedTextSchema(), required: true },
    description: { type: localizedTextSchema(), required: true },
    terms: { type: localizedTextSchema(false) },
    validUntil: { type: Date, required: true },
    imageUrl: { type: String },
    isPublished: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);

offerSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export type OfferDocument = InferSchemaType<typeof offerSchema>;

export const OfferModel: Model<OfferDocument> =
  models.Offer ?? model<OfferDocument>("Offer", offerSchema);
