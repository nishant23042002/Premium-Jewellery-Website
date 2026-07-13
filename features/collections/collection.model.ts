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

const collectionSchema = new Schema(
  {
    tenantId: tenantField,
    slug: { type: String, required: true, trim: true, lowercase: true },
    name: { type: localizedTextSchema(), required: true },
    description: { type: localizedTextSchema(false) },
    imageUrl: { type: String },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);

collectionSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export type CollectionDocument = InferSchemaType<typeof collectionSchema>;

export const CollectionModel: Model<CollectionDocument> =
  models.Collection ??
  model<CollectionDocument>("Collection", collectionSchema);
