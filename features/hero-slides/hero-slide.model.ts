import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { deletedAtField, tenantField } from "@/lib/db/schema-helpers";

const heroSlideSchema = new Schema(
  {
    tenantId: tenantField,
    // Two distinct pre-designed banner images (not one image cropped two
    // ways) — mirrors how Tanishq and similar sites ship a purpose-built
    // portrait creative for mobile and a purpose-built wide creative for
    // desktop, each with copy/branding already baked into the artwork.
    mobileImageUrl: { type: String, required: true },
    desktopImageUrl: { type: String, required: true },
    altText: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);
heroSlideSchema.index({ tenantId: 1, sortOrder: 1 });

export type HeroSlideDocument = InferSchemaType<typeof heroSlideSchema>;

export const HeroSlideModel: Model<HeroSlideDocument> =
  models.HeroSlide ?? model<HeroSlideDocument>("HeroSlide", heroSlideSchema);
