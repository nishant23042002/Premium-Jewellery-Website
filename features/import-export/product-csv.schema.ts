import { z } from "zod";
import { slugSchema } from "@/lib/validations/common";

/**
 * Row-level validation for CSV product import — every value arrives as a
 * raw string from Papa.parse, so numeric/enum fields are coerced and
 * checked here rather than trusted, matching the same constraints as
 * `productFormSchema` (min weights, gst range, valid enums) instead of the
 * previous silent-default-on-junk-input behavior.
 */
export const productCsvRowSchema = z.object({
  slug: slugSchema,
  skuCode: z.string().min(1, "SKU is required"),
  name_en: z.string().min(1, "name_en is required"),
  name_hi: z.string().optional().default(""),
  name_mr: z.string().optional().default(""),
  categorySlug: z.string().min(1, "categorySlug is required"),
  metalType: z.enum(["gold", "silver", "diamond", "other"], {
    message: "metalType must be gold, silver, diamond, or other",
  }),
  purity: z.string().min(1, "purity is required"),
  grossWeightGrams: z.coerce
    .number({ message: "grossWeightGrams must be a number" })
    .positive("grossWeightGrams must be greater than 0"),
  netWeightGrams: z.coerce
    .number({ message: "netWeightGrams must be a number" })
    .positive("netWeightGrams must be greater than 0"),
  makingChargeType: z.enum(["percentage", "per_gram", "flat"], {
    message: "makingChargeType must be percentage, per_gram, or flat",
  }),
  makingChargeValue: z.coerce
    .number({ message: "makingChargeValue must be a number" })
    .min(0, "makingChargeValue cannot be negative"),
  gstPercentage: z.coerce
    .number({ message: "gstPercentage must be a number" })
    .min(0)
    .max(100),
  quantity: z.coerce
    .number({ message: "quantity must be a number" })
    .int("quantity must be a whole number")
    .min(0, "quantity cannot be negative")
    .default(0),
  availability: z
    .enum(["in_showroom", "made_to_order", "reserved"])
    .default("in_showroom"),
  isFeatured: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  isPublished: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(";")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    ),
});

export type ProductCsvRow = z.infer<typeof productCsvRowSchema>;
