import { z } from "zod";
import {
  objectIdSchema,
  partialLocalizedTextSchema,
  slugSchema,
} from "@/lib/validations/common";

export const productFormSchema = z.object({
  categoryId: objectIdSchema,
  slug: slugSchema,
  skuCode: z.string().min(1, "SKU is required"),
  name: partialLocalizedTextSchema,
  // Not `partialLocalizedTextSchema.optional()` — that schema's "at least
  // one language filled in" refine still runs on the form's default
  // `{ en: "", hi: "", mr: "" }` value (a defined object, not `undefined`,
  // so `.optional()` doesn't skip it), silently blocking submission with no
  // visible error whenever Description is left blank. Description is
  // genuinely optional, so no "at least one locale" requirement belongs
  // here at all.
  description: z
    .object({
      en: z.string().optional(),
      hi: z.string().optional(),
      mr: z.string().optional(),
    })
    .optional(),
  metalType: z.enum(["gold", "silver", "platinum", "diamond", "other"]),
  purity: z.string().min(1, "Purity is required (e.g. 22K)"),
  grossWeightGrams: z.coerce
    .number()
    .positive("Gross weight must be greater than 0"),
  netWeightGrams: z.coerce
    .number()
    .positive("Net weight must be greater than 0"),
  makingChargeType: z.enum(["percentage", "per_gram", "flat"]),
  makingChargeValue: z.coerce
    .number()
    .min(0, "Making charge cannot be negative"),
  gstPercentage: z.coerce.number().min(0).max(100).default(3),
  stoneValue: z.coerce.number().min(0, "Stone value cannot be negative").default(0),
  certificationCost: z.coerce
    .number()
    .min(0, "Certification cost cannot be negative")
    .default(0),
  customCharges: z.coerce
    .number()
    .min(0, "Custom charges cannot be negative")
    .default(0),
  priceOverride: z
    .object({
      locked: z.boolean().default(false),
      fixedPrice: z.coerce.number().min(0).optional(),
    })
    .default({ locked: false }),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative")
    .default(0),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().min(1),
        sortOrder: z.number().int().default(0),
      }),
    )
    .default([]),
  videos: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().min(1),
        title: z.string().optional(),
      }),
    )
    .default([]),
  availability: z
    .enum(["in_showroom", "made_to_order", "reserved"])
    .default("in_showroom"),
  // Only required/shown in the admin form when availability is
  // "made_to_order" — enforced in the form component, not here, since the
  // schema has to accept the "not applicable" case (ready-stock products)
  // as absent rather than erroring.
  productionTimeDays: z
    .object({
      min: z.coerce.number().int().min(0),
      max: z.coerce.number().int().min(0),
    })
    .optional(),
  dispatchNote: z.string().trim().max(300).optional(),
  deliveryEstimateDays: z
    .object({
      min: z.coerce.number().int().min(0),
      max: z.coerce.number().int().min(0),
    })
    .optional(),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  barcode: z.string().trim().optional(),
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(160).optional(),
  canonicalUrl: z.string().trim().url().optional().or(z.literal("")),
  ogTitle: z.string().trim().max(70).optional(),
  ogDescription: z.string().trim().max(200).optional(),
  ogImageUrl: z.string().trim().url().optional().or(z.literal("")),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
/** Pre-`.default()` shape — what react-hook-form actually holds before submit. */
export type ProductFormInput = z.input<typeof productFormSchema>;
