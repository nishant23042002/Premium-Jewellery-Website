import { z } from "zod";

export const heroSlideFormSchema = z.object({
  mobileImageUrl: z.string().url("Choose a mobile banner image"),
  desktopImageUrl: z.string().url("Choose a desktop banner image"),
  altText: z.string().max(200).default(""),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(false),
});

export type HeroSlideFormValues = z.infer<typeof heroSlideFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type HeroSlideFormInput = z.input<typeof heroSlideFormSchema>;
