import { z } from "zod";
import {
  objectIdSchema,
  partialLocalizedTextSchema,
  slugSchema,
} from "@/lib/validations/common";

export const categoryFormSchema = z.object({
  slug: slugSchema,
  name: partialLocalizedTextSchema,
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  parentId: objectIdSchema.nullable().optional(),
  isPublished: z.boolean().default(false),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type CategoryFormInput = z.input<typeof categoryFormSchema>;
