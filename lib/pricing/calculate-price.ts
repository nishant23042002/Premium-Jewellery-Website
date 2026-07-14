import type {
  MakingChargeType,
  MetalType,
} from "@/features/products/product.types";
import type { PriceBreakdown } from "@/features/products/product.types";

interface RateEntry {
  ratePerGram: number;
  effectiveDate: string;
}

interface RatesByMetal {
  gold: RateEntry | null;
  silver: RateEntry | null;
  platinum: RateEntry | null;
}

/**
 * Single source of truth for "which MetalRate applies to this product" —
 * gold/silver/platinum map directly; diamond/other have no metal-weight
 * rate concept of their own (a future carat-based pricing model would
 * replace this, not extend it), so they fall back to the silver rate,
 * preserving the exact behavior this app already had before platinum
 * support existed.
 */
export function rateForMetalType(
  metalType: MetalType,
  rates: RatesByMetal,
): RateEntry | null {
  switch (metalType) {
    case "gold":
      return rates.gold;
    case "silver":
      return rates.silver;
    case "platinum":
      return rates.platinum;
    default:
      return rates.silver;
  }
}

export interface CalculatePriceInput {
  netWeightGrams: number;
  makingChargeType: MakingChargeType;
  makingChargeValue: number;
  gstPercentage: number;
  /** Null when no rate has been entered yet for today (PRD §42). */
  metalRatePerGram: number | null;
  rateEffectiveDate: string | null;
  /** Flat rupee add-ons — all default to 0, so every pre-existing caller (that only ever passed the fields above) keeps computing the exact same price it always has. */
  stoneValue?: number;
  certificationCost?: number;
  customCharges?: number;
  /** When `locked` with a `fixedPrice` set, the formula below is skipped entirely — see PriceOverride. */
  override?: { locked: boolean; fixedPrice?: number };
}

/**
 * Single source of truth for turning a product's weight/making-charge/GST
 * fields plus today's metal rate into the price shown to customers.
 *
 * Price is deliberately never persisted (PRD §12) — every render calls this
 * with the latest MetalRate so the whole storefront stays correct the
 * instant staff update the day's rate, with no cache-invalidation logic.
 */
export function calculatePrice({
  netWeightGrams,
  makingChargeType,
  makingChargeValue,
  gstPercentage,
  metalRatePerGram,
  rateEffectiveDate,
  stoneValue = 0,
  certificationCost = 0,
  customCharges = 0,
  override,
}: CalculatePriceInput): PriceBreakdown {
  if (netWeightGrams < 0) {
    throw new Error("netWeightGrams cannot be negative");
  }
  if (makingChargeValue < 0) {
    throw new Error("makingChargeValue cannot be negative");
  }
  if (gstPercentage < 0) {
    throw new Error("gstPercentage cannot be negative");
  }

  if (override?.locked && override.fixedPrice !== undefined && override.fixedPrice >= 0) {
    return {
      metalRatePerGram: 0,
      weightGrams: netWeightGrams,
      metalValue: 0,
      makingCharge: 0,
      stoneValue: 0,
      certificationCost: 0,
      customCharges: 0,
      subtotal: 0,
      gstAmount: 0,
      total: round2(override.fixedPrice),
      rateEffectiveDate,
      isRatePending: false,
      isOverridden: true,
    };
  }

  if (metalRatePerGram === null) {
    return {
      metalRatePerGram: 0,
      weightGrams: netWeightGrams,
      metalValue: 0,
      makingCharge: 0,
      stoneValue: 0,
      certificationCost: 0,
      customCharges: 0,
      subtotal: 0,
      gstAmount: 0,
      total: 0,
      rateEffectiveDate: null,
      isRatePending: true,
      isOverridden: false,
    };
  }

  const metalValue = round2(netWeightGrams * metalRatePerGram);
  const makingCharge = round2(
    calculateMakingCharge(makingChargeType, makingChargeValue, {
      netWeightGrams,
      metalValue,
    }),
  );
  const subtotal = round2(
    metalValue + makingCharge + stoneValue + certificationCost + customCharges,
  );
  const gstAmount = round2(subtotal * (gstPercentage / 100));
  const total = round2(subtotal + gstAmount);

  return {
    metalRatePerGram,
    weightGrams: netWeightGrams,
    metalValue,
    makingCharge,
    stoneValue,
    certificationCost,
    customCharges,
    subtotal,
    gstAmount,
    total,
    rateEffectiveDate,
    isRatePending: false,
    isOverridden: false,
  };
}

function calculateMakingCharge(
  type: MakingChargeType,
  value: number,
  ctx: { netWeightGrams: number; metalValue: number },
): number {
  switch (type) {
    case "percentage":
      return ctx.metalValue * (value / 100);
    case "per_gram":
      return ctx.netWeightGrams * value;
    case "flat":
      return value;
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unhandled making charge type: ${_exhaustive}`);
    }
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
