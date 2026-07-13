import { z } from "zod";

export const announcementBarFormSchema = z.object({
  isActive: z.boolean().default(false),
  message: z.string().max(200),
  linkLabel: z.string().max(40).optional().or(z.literal("")),
  linkHref: z.string().optional().or(z.literal("")),
});

export type AnnouncementBarFormValues = z.infer<
  typeof announcementBarFormSchema
>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type AnnouncementBarFormInput = z.input<
  typeof announcementBarFormSchema
>;
