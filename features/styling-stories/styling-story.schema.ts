import { z } from "zod";
import { partialLocalizedTextSchema } from "@/lib/validations/common";

export const stylingStoryFormSchema = z.object({
  title: partialLocalizedTextSchema,
  // Not `partialLocalizedTextSchema.optional()` — that schema's "at least
  // one language filled in" refine still runs on the form's default
  // `{ en: "", hi: "", mr: "" }` value (a defined object, not `undefined`,
  // so `.optional()` doesn't skip it), silently blocking submission with no
  // visible error whenever Subtitle is left blank. Subtitle is genuinely
  // optional, so no "at least one locale" requirement belongs here at all.
  subtitle: z
    .object({
      en: z.string().optional(),
      hi: z.string().optional(),
      mr: z.string().optional(),
    })
    .optional(),
  coverImageUrl: z.string().url("Choose a cover image"),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(false),
});

export type StylingStoryFormValues = z.infer<typeof stylingStoryFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type StylingStoryFormInput = z.input<typeof stylingStoryFormSchema>;
