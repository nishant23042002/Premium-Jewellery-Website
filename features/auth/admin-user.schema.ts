import { z } from "zod";

export const adminUserFormSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100),
  email: z.string().email("Enter a valid email address"),
  /** Left blank on edit to keep the existing password. */
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
  role: z.enum(["owner", "staff"]),
  /** Custom Role slug for staff accounts — ignored for owners (always superuser). */
  roleSlug: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type AdminUserFormValues = z.infer<typeof adminUserFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type AdminUserFormInput = z.input<typeof adminUserFormSchema>;
