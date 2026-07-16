import type { LocalizedText } from "@/types/common";

/** Below this quantity (and above 0), the storefront shows a "low stock" badge instead of nothing. */
export const LOW_STOCK_THRESHOLD = 5;

/** A product counts as "New Arrival" while it's within this many days of creation — computed, not stored. */
export const NEW_ARRIVAL_WINDOW_DAYS = 30;
/** Window used for both "Trending" (page views) and "Best Seller" (reservations) computed badges. */
export const TRENDING_WINDOW_DAYS = 14;
export const BADGE_LIST_LIMIT = 12;

export type MetalType = "gold" | "silver" | "platinum" | "diamond" | "other";
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

/** Admin can bypass the formula entirely for a specific piece (a one-off promotional price, a piece priced by negotiation, etc.) — `fixedPrice` is the complete final price shown to customers, GST and all, when `locked` is true. */
export interface PriceOverride {
  locked: boolean;
  fixedPrice?: number;
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
  /** Cost of set stones (diamonds, gemstones) — a flat rupee amount, not weight/rate-derived like the metal itself. */
  stoneValue: number;
  /** Hallmark/BIS or other certification cost, passed through as a flat rupee line item. */
  certificationCost: number;
  /** Catch-all flat addition (e.g. a design surcharge) not covered by the other components. */
  customCharges: number;
  priceOverride: PriceOverride;
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
  /** Not unique — the same design in multiple sizes can share a manufacturer barcode. Lookup aid for import duplicate-detection, not an identity field. */
  barcode?: string;
  /** Per-product SEO overrides — all optional, fall back to name/description-derived defaults at render time when unset. */
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
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

/** "New Arrival" is computed from `createdAt`, never stored — a pure function so both server queries and client components can check it without a round trip. */
export function isNewArrival(product: Pick<Product, "createdAt">): boolean {
  const ageMs = Date.now() - new Date(product.createdAt).getTime();
  return ageMs <= NEW_ARRIVAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/** Line-item breakdown surfaced in the product price accordion (PRD §21, §24). */
export interface PriceBreakdown {
  metalRatePerGram: number;
  weightGrams: number;
  metalValue: number;
  makingCharge: number;
  stoneValue: number;
  certificationCost: number;
  customCharges: number;
  subtotal: number;
  gstAmount: number;
  total: number;
  rateEffectiveDate: string | null;
  /** True when no MetalRate has been entered yet for today — PRD §42 graceful degradation. */
  isRatePending: boolean;
  /** True when this product has a locked fixed price — `total` is the admin-set value, not formula-derived, and the other line items above are not meaningful (left at 0). */
  isOverridden: boolean;
}
