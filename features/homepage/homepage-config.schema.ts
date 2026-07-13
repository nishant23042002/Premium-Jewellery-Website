import { z } from "zod";

export const homepageConfigFormSchema = z.object({
  showTrustBar: z.boolean().default(true),
  showCollections: z.boolean().default(true),
  showCategories: z.boolean().default(true),
  showOnlineExclusive: z.boolean().default(true),
  showAllProducts: z.boolean().default(true),
  showNewArrivals: z.boolean().default(true),
  showStyling: z.boolean().default(true),
  showStoryTeaser: z.boolean().default(true),
  showExperience: z.boolean().default(true),
  showTestimonials: z.boolean().default(true),
  storyImageUrl: z.string().url().optional().or(z.literal("")),
  experienceVisitStoreImageUrl: z.string().url().optional().or(z.literal("")),
  experienceBookAppointmentImageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("")),
  experienceTalkToExpertImageUrl: z.string().url().optional().or(z.literal("")),
  experienceReadJournalImageUrl: z.string().url().optional().or(z.literal("")),
  experienceJewelleryCareImageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("")),
  experienceHallmarkImageUrl: z.string().url().optional().or(z.literal("")),
});

export type HomepageConfigFormValues = z.infer<typeof homepageConfigFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type HomepageConfigFormInput = z.input<typeof homepageConfigFormSchema>;
