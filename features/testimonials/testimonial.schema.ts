import { z } from "zod";

export const testimonialFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  quote: z.string().min(1, "Quote is required").max(1000),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(false),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type TestimonialFormInput = z.input<typeof testimonialFormSchema>;
