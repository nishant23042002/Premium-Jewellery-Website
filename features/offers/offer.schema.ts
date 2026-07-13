import { z } from "zod";
import {
  partialLocalizedTextSchema,
  slugSchema,
} from "@/lib/validations/common";

export const offerFormSchema = z.object({
  slug: slugSchema,
  title: partialLocalizedTextSchema,
  description: partialLocalizedTextSchema,
  // Not `partialLocalizedTextSchema.optional()` — that schema's "at least
  // one language filled in" refine still runs on the form's default
  // `{ en: "", hi: "", mr: "" }` value (a defined object, not `undefined`,
  // so `.optional()` doesn't skip it), silently blocking submission with no
  // visible error whenever Terms is left blank. Terms is genuinely
  // optional, so no "at least one locale" requirement belongs here at all.
  terms: z
    .object({
      en: z.string().optional(),
      hi: z.string().optional(),
      mr: z.string().optional(),
    })
    .optional(),
  validUntil: z.coerce.date(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export type OfferFormValues = z.infer<typeof offerFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type OfferFormInput = z.input<typeof offerFormSchema>;
