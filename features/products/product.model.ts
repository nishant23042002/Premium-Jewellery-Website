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

const productImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    altText: { type: localizedTextSchema(false) },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const productVideoSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    title: { type: String },
  },
  { _id: false },
);

/** Only meaningful when `availability === "made_to_order"` — a day-range, since a fixed single number is never accurate for handmade pieces. */
const dayRangeSchema = new Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    tenantId: tenantField,
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    slug: { type: String, required: true, trim: true, lowercase: true },
    skuCode: { type: String, required: true, trim: true, uppercase: true },
    name: { type: localizedTextSchema(), required: true },
    description: { type: localizedTextSchema(false), required: true },
    metalType: {
      type: String,
      enum: ["gold", "silver", "platinum", "diamond", "other"],
      required: true,
    },
    purity: { type: String, required: true, trim: true },
    grossWeightGrams: { type: Number, required: true, min: 0 },
    netWeightGrams: { type: Number, required: true, min: 0 },
    makingChargeType: {
      type: String,
      enum: ["percentage", "per_gram", "flat"],
      required: true,
      default: "percentage",
    },
    makingChargeValue: { type: Number, required: true, min: 0 },
    gstPercentage: { type: Number, required: true, default: 3 },
    stoneValue: { type: Number, default: 0, min: 0 },
    certificationCost: { type: Number, default: 0, min: 0 },
    customCharges: { type: Number, default: 0, min: 0 },
    priceOverride: {
      type: new Schema(
        {
          locked: { type: Boolean, default: false },
          fixedPrice: { type: Number, min: 0 },
        },
        { _id: false },
      ),
      default: () => ({ locked: false }),
    },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    images: { type: [productImageSchema], default: [] },
    videos: { type: [productVideoSchema], default: [] },
    availability: {
      type: String,
      enum: ["in_showroom", "made_to_order", "reserved"],
      default: "in_showroom",
    },
    productionTimeDays: { type: dayRangeSchema },
    dispatchNote: { type: String, trim: true },
    deliveryEstimateDays: { type: dayRangeSchema },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    // Not unique — the same design in multiple sizes can legitimately share
    // a manufacturer barcode. Purely a lookup aid for duplicate detection
    // during bulk import, not an identity field like slug/skuCode.
    barcode: { type: String, trim: true },
    // Per-product SEO overrides — all optional, all fall back to
    // name/description-derived defaults at render time when unset.
    // Deliberately no stored JSON-LD/schema field: structured data is
    // generated from the product's existing fields at render time instead
    // of hand-authored, so it never drifts out of sync with the real data.
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    canonicalUrl: { type: String, trim: true },
    ogTitle: { type: String, trim: true },
    ogDescription: { type: String, trim: true },
    ogImageUrl: { type: String, trim: true },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);

productSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
productSchema.index({ tenantId: 1, skuCode: 1 }, { unique: true });
productSchema.index({ tenantId: 1, categoryId: 1, isPublished: 1 });
productSchema.index({ tenantId: 1, tags: 1 });
productSchema.index({ tenantId: 1, barcode: 1 }, { sparse: true });
// Powers relevance-ranked catalogue search (listProducts `query` param) —
// weights favor an exact-ish name/SKU match over a description mention.
productSchema.index(
  {
    "name.en": "text",
    skuCode: "text",
    tags: "text",
    "description.en": "text",
  },
  {
    name: "ProductSearchIndex",
    weights: { "name.en": 10, skuCode: 8, tags: 5, "description.en": 1 },
  },
);

export type ProductDocument = InferSchemaType<typeof productSchema>;

export const ProductModel: Model<ProductDocument> =
  models.Product ?? model<ProductDocument>("Product", productSchema);
