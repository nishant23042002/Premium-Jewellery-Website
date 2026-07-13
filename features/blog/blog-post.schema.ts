import { z } from "zod";
import {
  partialLocalizedTextSchema,
  slugSchema,
} from "@/lib/validations/common";

export const blogPostFormSchema = z.object({
  slug: slugSchema,
  title: partialLocalizedTextSchema,
  excerpt: partialLocalizedTextSchema,
  content: partialLocalizedTextSchema,
  category: z.string().min(1, "Category is required"),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  author: z.string().min(1, "Author is required"),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
  publishedAt: z.coerce.date(),
});

export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;
/** Pre-`.default()`/`.coerce()` shape — what react-hook-form actually holds before submit. */
export type BlogPostFormInput = z.input<typeof blogPostFormSchema>;
