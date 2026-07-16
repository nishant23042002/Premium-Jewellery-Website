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

const categorySchema = new Schema(
  {
    tenantId: tenantField,
    slug: { type: String, required: true, trim: true, lowercase: true },
    name: { type: localizedTextSchema(), required: true },
    description: { type: localizedTextSchema(false) },
    imageUrl: { type: String },
    sortOrder: { type: Number, default: 0 },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isPublished: { type: Boolean, default: false },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);

categorySchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export type CategoryDocument = InferSchemaType<typeof categorySchema>;

export const CategoryModel: Model<CategoryDocument> =
  models.Category ?? model<CategoryDocument>("Category", categorySchema);
