import { z } from "zod";
import { slugSchema } from "@/lib/validations/common";

export const roleFormSchema = z.object({
  name: z.string().min(2, "Name is too short").max(60),
  slug: slugSchema,
  permissions: z.array(z.string()).default([]),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type RoleFormInput = z.input<typeof roleFormSchema>;
