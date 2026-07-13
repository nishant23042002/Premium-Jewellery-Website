export type RateMetalType = "gold" | "silver";

export interface MetalRate {
  id: string;
  tenantId: string;
  metalType: RateMetalType;
  purity: string;
  ratePerGram: number;
  effectiveDate: string;
  setByAdminId: string;
  createdAt: string;
}
