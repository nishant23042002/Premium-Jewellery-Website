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

const faqItemSchema = new Schema(
  {
    tenantId: tenantField,
    question: { type: localizedTextSchema(), required: true },
    answer: { type: localizedTextSchema(), required: true },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);

faqItemSchema.index({ tenantId: 1, sortOrder: 1 });

export type FaqItemDocument = InferSchemaType<typeof faqItemSchema>;

export const FaqItemModel: Model<FaqItemDocument> =
  models.FaqItem ?? model<FaqItemDocument>("FaqItem", faqItemSchema);
