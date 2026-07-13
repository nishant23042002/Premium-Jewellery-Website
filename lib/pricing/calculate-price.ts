import type { MakingChargeType } from "@/features/products/product.types";
import type { PriceBreakdown } from "@/features/products/product.types";

export interface CalculatePriceInput {
  netWeightGrams: number;
  makingChargeType: MakingChargeType;
  makingChargeValue: number;
  gstPercentage: number;
  /** Null when no rate has been entered yet for today (PRD §42). */
  metalRatePerGram: number | null;
  rateEffectiveDate: string | null;
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

  if (metalRatePerGram === null) {
    return {
      metalRatePerGram: 0,
      weightGrams: netWeightGrams,
      metalValue: 0,
      makingCharge: 0,
      subtotal: 0,
      gstAmount: 0,
      total: 0,
      rateEffectiveDate: null,
      isRatePending: true,
    };
  }

  const metalValue = round2(netWeightGrams * metalRatePerGram);
  const makingCharge = round2(
    calculateMakingCharge(makingChargeType, makingChargeValue, {
      netWeightGrams,
      metalValue,
    }),
  );
  const subtotal = round2(metalValue + makingCharge);
  const gstAmount = round2(subtotal * (gstPercentage / 100));
  const total = round2(subtotal + gstAmount);

  return {
    metalRatePerGram,
    weightGrams: netWeightGrams,
    metalValue,
    makingCharge,
    subtotal,
    gstAmount,
    total,
    rateEffectiveDate,
    isRatePending: false,
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
