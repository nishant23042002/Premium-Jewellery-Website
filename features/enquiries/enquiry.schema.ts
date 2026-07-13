import { z } from "zod";
import { objectIdSchema } from "@/lib/validations/common";

export const enquiryFormSchema = z.object({
  productId: objectIdSchema.optional(),
  name: z.string().min(2, "Name is too short").max(100),
  phone: z.string().regex(/^[+]?[0-9\s-]{7,15}$/, "Enter a valid phone number"),
  message: z.string().max(1000).optional(),
  source: z.enum(["whatsapp", "form", "call_request"]).default("form"),
});

export type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit (source optional until applied). */
export type EnquiryFormInput = z.input<typeof enquiryFormSchema>;
