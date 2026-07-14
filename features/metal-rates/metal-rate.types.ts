export type RateMetalType = "gold" | "silver" | "platinum";

/** "manual" — a staff member typed this in (the original/default flow). "api" — written by the live-rate fetch (features/metal-rates/providers). */
export type RateSource = "manual" | "api";

export interface MetalRate {
  id: string;
  tenantId: string;
  metalType: RateMetalType;
  purity: string;
  ratePerGram: number;
  effectiveDate: string;
  /** Absent for source: "api" rates — there's no staff actor for an automated fetch. */
  setByAdminId?: string;
  source: RateSource;
  providerName?: string;
  createdAt: string;
}
