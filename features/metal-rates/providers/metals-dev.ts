import "server-only";
import type { MetalRateProvider } from "@/features/metal-rates/providers/types";

const ENDPOINT = "https://api.metals.dev/v1/latest";

interface MetalsDevResponse {
  status: string;
  metals?: Record<string, number>;
}

/**
 * https://www.metals.dev — free-tier live gold/silver/platinum/palladium
 * spot prices, with direct INR + per-gram conversion (`currency=INR&unit=g`)
 * so no troy-ounce or USD/INR conversion math is needed on our end. Returns
 * the *fine* metal rate (24K gold, 999 silver/platinum) — karat/purity
 * conversion to what the store actually sells happens in the caller, via
 * admin-configured purity factors.
 */
export const metalsDevProvider: MetalRateProvider = {
  name: "metals.dev",

  async fetchLatestRates(apiKey) {
    const url = `${ENDPOINT}?api_key=${encodeURIComponent(apiKey)}&currency=INR&unit=g`;

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(
        `metals.dev request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as MetalsDevResponse;
    if (data.status !== "success") {
      throw new Error(
        `metals.dev returned a non-success status: ${JSON.stringify(data).slice(0, 300)}`,
      );
    }

    const metals = data.metals ?? {};
    const gold = Number(metals.gold);
    const silver = Number(metals.silver);
    const platinum = Number(metals.platinum);

    if (!Number.isFinite(gold) || gold <= 0) {
      throw new Error(`metals.dev: invalid gold rate in response (${metals.gold})`);
    }
    if (!Number.isFinite(silver) || silver <= 0) {
      throw new Error(`metals.dev: invalid silver rate in response (${metals.silver})`);
    }
    if (!Number.isFinite(platinum) || platinum <= 0) {
      throw new Error(
        `metals.dev: invalid platinum rate in response (${metals.platinum})`,
      );
    }

    return { gold, silver, platinum };
  },
};
