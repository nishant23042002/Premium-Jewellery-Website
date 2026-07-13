import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { deletedAtField, tenantField } from "@/lib/db/schema-helpers";

const testimonialSchema = new Schema(
  {
    tenantId: tenantField,
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    quote: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);

testimonialSchema.index({ tenantId: 1, sortOrder: 1 });

export type TestimonialDocument = InferSchemaType<typeof testimonialSchema>;

export const TestimonialModel: Model<TestimonialDocument> =
  models.Testimonial ??
  model<TestimonialDocument>("Testimonial", testimonialSchema);
