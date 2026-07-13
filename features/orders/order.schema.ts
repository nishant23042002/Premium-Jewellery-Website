import { z } from "zod";

export const addressSnapshotSchema = z.object({
  label: z.string().trim().optional(),
  line1: z.string().trim().min(1, "Address line 1 is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  phone: z.string().trim().min(10, "Enter a valid phone number"),
});

export const createRazorpayOrderSchema = z.object({
  shippingAddress: addressSnapshotSchema,
  billingAddress: addressSnapshotSchema,
  email: z.string().email(),
  couponCode: z.string().trim().optional(),
});
export type CreateRazorpayOrderInput = z.infer<
  typeof createRazorpayOrderSchema
>;

export const verifyRazorpayPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
export type VerifyRazorpayPaymentInput = z.infer<
  typeof verifyRazorpayPaymentSchema
>;

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "payment_received",
    "confirmed",
    "waiting_for_production",
    "in_production",
    "quality_check",
    "packed",
    "ready_to_dispatch",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  note: z.string().trim().max(500).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const updateTrackingSchema = z.object({
  trackingNumber: z.string().trim().min(1),
  courier: z.string().trim().min(1),
});
export type UpdateTrackingInput = z.infer<typeof updateTrackingSchema>;
