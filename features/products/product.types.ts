import type { LocalizedText } from "@/types/common";

/** Below this quantity (and above 0), the storefront shows a "low stock" badge instead of nothing. */
export const LOW_STOCK_THRESHOLD = 5;

export type MetalType = "gold" | "silver" | "diamond" | "other";
export type MakingChargeType = "percentage" | "per_gram" | "flat";
/** Admin-set showroom signal, independent of `quantity` — a piece can be `in_showroom` with low/zero stock (made-to-order lead time still applies) or `reserved` while stock remains. */
export type Availability = "in_showroom" | "made_to_order" | "reserved";

export interface ProductImage {
  url: string;
  publicId: string;
  altText?: LocalizedText;
  sortOrder: number;
}

export interface ProductVideo {
  url: string;
  publicId: string;
  title?: string;
}

export interface DayRange {
  min: number;
  max: number;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  slug: string;
  skuCode: string;
  name: LocalizedText;
  description: LocalizedText;
  metalType: MetalType;
  purity: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  makingChargeType: MakingChargeType;
  makingChargeValue: number;
  gstPercentage: number;
  quantity: number;
  images: ProductImage[];
  videos: ProductVideo[];
  availability: Availability;
  /** Only meaningful when `availability === "made_to_order"`. */
  productionTimeDays?: DayRange;
  dispatchNote?: string;
  deliveryEstimateDays?: DayRange;
  isFeatured: boolean;
  isPublished: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Single source of truth for "is this a Made-to-Order product?" — every
 * purchasing/UI/inventory decision that needs to branch on product type
 * reads this instead of comparing `availability` directly, so there's one
 * place to change if that ever grows into a richer signal.
 */
export function isMadeToOrder(product: Pick<Product, "availability">): boolean {
  return product.availability === "made_to_order";
}

/** Line-item breakdown surfaced in the product price accordion (PRD §21, §24). */
export interface PriceBreakdown {
  metalRatePerGram: number;
  weightGrams: number;
  metalValue: number;
  makingCharge: number;
  subtotal: number;
  gstAmount: number;
  total: number;
  rateEffectiveDate: string | null;
  /** True when no MetalRate has been entered yet for today — PRD §42 graceful degradation. */
  isRatePending: boolean;
}
