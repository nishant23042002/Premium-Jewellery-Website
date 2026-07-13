import { z } from "zod";
import { objectIdSchema } from "@/lib/validations/common";

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const reservationFormSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100),
  phone: z.string().regex(/^[+]?[0-9\s-]{7,15}$/, "Enter a valid phone number"),
  email: z
    .string()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  preferredDate: z.coerce
    .date()
    .min(todayStart(), "Preferred date can't be in the past"),
  preferredTimeSlot: z.string().min(1, "Please choose a time slot"),
  branchId: z.string().min(1, "Please choose a branch"),
  productIds: z
    .array(objectIdSchema)
    .max(10, "Select at most 10 pieces")
    .default([]),
  message: z.string().max(1000).optional(),
});

export type ReservationFormInput = z.input<typeof reservationFormSchema>;
export type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export const reservationStatusUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  note: z.string().max(500).optional(),
});

export type ReservationStatusUpdateValues = z.infer<
  typeof reservationStatusUpdateSchema
>;
