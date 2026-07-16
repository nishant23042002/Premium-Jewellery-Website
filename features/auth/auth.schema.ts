import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const requestAdminPasswordResetSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type RequestAdminPasswordResetInput = z.infer<
  typeof requestAdminPasswordResetSchema
>;

export const resetAdminPasswordSchema = z
  .object({
    token: z.string().min(1, "Missing reset token"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ResetAdminPasswordInput = z.infer<typeof resetAdminPasswordSchema>;
