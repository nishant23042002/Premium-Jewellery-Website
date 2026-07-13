import { z } from "zod";
import {
  objectIdSchema,
  partialLocalizedTextSchema,
  slugSchema,
} from "@/lib/validations/common";

export const collectionFormSchema = z.object({
  slug: slugSchema,
  name: partialLocalizedTextSchema,
  // Not `partialLocalizedTextSchema.optional()` — that schema's "at least
  // one language filled in" refine still runs on the form's default
  // `{ en: "", hi: "", mr: "" }` value (a defined object, not `undefined`,
  // so `.optional()` doesn't skip it), silently blocking submission with no
  // visible error whenever Description is left blank. Description is
  // genuinely optional, so no "at least one locale" requirement belongs
  // here at all.
  description: z
    .object({
      en: z.string().optional(),
      hi: z.string().optional(),
      mr: z.string().optional(),
    })
    .optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  productIds: z.array(objectIdSchema).default([]),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export type CollectionFormValues = z.infer<typeof collectionFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type CollectionFormInput = z.input<typeof collectionFormSchema>;
