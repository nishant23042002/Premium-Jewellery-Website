import { z } from "zod";
import {
  partialLocalizedTextSchema,
  slugSchema,
} from "@/lib/validations/common";

export const eventFormSchema = z.object({
  slug: slugSchema,
  title: partialLocalizedTextSchema,
  description: partialLocalizedTextSchema,
  date: z.coerce.date(),
  location: z.string().min(1, "Location is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
/** Pre-`.default()`/`.coerce()` shape — what react-hook-form actually holds before submit. */
export type EventFormInput = z.input<typeof eventFormSchema>;
