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

const blogPostSchema = new Schema(
  {
    tenantId: tenantField,
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: localizedTextSchema(), required: true },
    excerpt: { type: localizedTextSchema(), required: true },
    content: { type: localizedTextSchema(), required: true },
    category: { type: String, required: true, trim: true },
    coverImageUrl: { type: String },
    author: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, required: true, default: () => new Date() },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);

blogPostSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export type BlogPostDocument = InferSchemaType<typeof blogPostSchema>;

export const BlogPostModel: Model<BlogPostDocument> =
  models.BlogPost ?? model<BlogPostDocument>("BlogPost", blogPostSchema);
