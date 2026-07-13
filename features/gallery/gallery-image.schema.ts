import { z } from "zod";

export const galleryImageFormSchema = z.object({
  imageUrl: z.string().url("Choose an image"),
  // Not `partialLocalizedTextSchema.optional()` — that schema's "at least
  // one language filled in" refine still runs on the form's default
  // `{ en: "", hi: "", mr: "" }` value (a defined object, not `undefined`,
  // so `.optional()` doesn't skip it), silently blocking submission with no
  // visible error whenever Caption is left blank. Caption is genuinely
  // optional, so no "at least one locale" requirement belongs here at all.
  caption: z
    .object({
      en: z.string().optional(),
      hi: z.string().optional(),
      mr: z.string().optional(),
    })
    .optional(),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(false),
});

export type GalleryImageFormValues = z.infer<typeof galleryImageFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type GalleryImageFormInput = z.input<typeof galleryImageFormSchema>;
