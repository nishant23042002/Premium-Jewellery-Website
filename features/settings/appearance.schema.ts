import { z } from "zod";

export const appearanceFormSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  faviconUrl: z.string().url().optional().or(z.literal("")),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color, e.g. #C6A567")
    .optional()
    .or(z.literal("")),
});

export type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;
export type AppearanceFormInput = z.input<typeof appearanceFormSchema>;
