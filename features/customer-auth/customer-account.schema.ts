import { z } from "zod";

export const signupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || v.trim().length >= 10, "Enter a valid phone number")
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type SignupFormInput = z.input<typeof signupFormSchema>;

export const customerLoginFormSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type CustomerLoginFormValues = z.infer<typeof customerLoginFormSchema>;

export const addressFormSchema = z.object({
  label: z.string().trim().min(1).default("Home"),
  line1: z.string().trim().min(1, "Address line 1 is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  isDefault: z.boolean().default(false),
});
export type AddressFormValues = z.infer<typeof addressFormSchema>;
export type AddressFormInput = z.input<typeof addressFormSchema>;
