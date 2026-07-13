import { z } from "zod";
import {
  partialLocalizedTextSchema,
  slugSchema,
} from "@/lib/validations/common";

export const cmsPageFormSchema = z.object({
  slug: slugSchema,
  title: partialLocalizedTextSchema,
  content: partialLocalizedTextSchema,
  isPublished: z.boolean().default(false),
});

export type CmsPageFormValues = z.infer<typeof cmsPageFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type CmsPageFormInput = z.input<typeof cmsPageFormSchema>;
