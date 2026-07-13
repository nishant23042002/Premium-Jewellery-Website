import { z } from "zod";
import { partialLocalizedTextSchema } from "@/lib/validations/common";

export const faqItemFormSchema = z.object({
  question: partialLocalizedTextSchema,
  answer: partialLocalizedTextSchema,
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(false),
});

export type FaqItemFormValues = z.infer<typeof faqItemFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type FaqItemFormInput = z.input<typeof faqItemFormSchema>;
