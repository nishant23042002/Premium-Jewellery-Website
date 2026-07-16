import { z } from "zod";
import {
  objectIdSchema,
  partialLocalizedTextSchema,
  slugSchema,
} from "@/lib/validations/common";

export const categoryFormSchema = z.object({
  slug: slugSchema,
  name: partialLocalizedTextSchema,
  // Not `partialLocalizedTextSchema.optional()` — see collection.schema.ts's
  // identical note: that schema's "at least one language filled in" refine
  // still runs on the form's default `{ en: "", hi: "", mr: "" }` value, so
  // a genuinely optional field needs its own plain-optional-strings shape.
  description: z
    .object({
      en: z.string().optional(),
      hi: z.string().optional(),
      mr: z.string().optional(),
    })
    .optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  parentId: objectIdSchema.nullable().optional(),
  isPublished: z.boolean().default(false),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type CategoryFormInput = z.input<typeof categoryFormSchema>;
