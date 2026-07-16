import { z } from "zod";

export const seoFormSchema = z.object({
  defaultTitle: z.string().max(70).optional().or(z.literal("")),
  defaultDescription: z.string().max(200).optional().or(z.literal("")),
  defaultKeywords: z.string().max(300).optional().or(z.literal("")),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
});

export type SeoFormValues = z.infer<typeof seoFormSchema>;
export type SeoFormInput = z.input<typeof seoFormSchema>;
