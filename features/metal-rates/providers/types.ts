/** ₹/gram for the fine (undiluted) metal — 24K gold, 999 silver, 999 platinum — before any karat/purity conversion the store applies for what it actually sells. */
export interface FetchedRates {
  gold: number;
  silver: number;
  platinum: number;
}

/**
 * Every metals-price provider this app might integrate with implements this
 * — swapping metals.dev for a different service later (or adding a second
 * one as a fallback) means writing one new file here, not touching the
 * sync/fetch logic that calls it.
 */
export interface MetalRateProvider {
  name: string;
  fetchLatestRates(apiKey: string): Promise<FetchedRates>;
}
