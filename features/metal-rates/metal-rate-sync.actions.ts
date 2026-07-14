"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { MetalRateModel } from "@/features/metal-rates/metal-rate.model";
import {
  getSiteSetting,
  setSiteSetting,
} from "@/features/site-settings/site-setting.actions";
import { metalsDevProvider } from "@/features/metal-rates/providers/metals-dev";
import { logAudit, logSystemAudit } from "@/features/audit-logs/audit-log.actions";
import { getServerEnv } from "@/config/env";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { RateMetalType } from "@/features/metal-rates/metal-rate.types";
import type { SessionPayload } from "@/features/auth/admin-user.types";

const CONFIG_KEY = "metal_rate_provider_config";

const RATE_PURITY: Record<RateMetalType, string> = {
  gold: "22K",
  silver: "999",
  platinum: "950",
};

export interface MetalRateProviderConfig {
  /** Auto-fetch is opt-in — stays off until an admin turns it on from the Pricing Dashboard, so the free-tier request budget is never spent without explicit consent. */
  enabled: boolean;
  refreshIntervalHours: number;
  /** Converts the fetched *fine* metal rate (24K gold, 999 silver/platinum) to what the store actually sells (22K gold, etc.) — admin-editable since a shop's exact purity mix is a business decision, not a constant. */
  purityFactors: Record<RateMetalType, number>;
  lastFetch: {
    status: "success" | "error" | "never";
    at: string | null;
    error?: string;
    warnings?: string[];
  };
}

const DEFAULT_CONFIG: MetalRateProviderConfig = {
  enabled: false,
  refreshIntervalHours: 4,
  purityFactors: { gold: 22 / 24, silver: 1, platinum: 0.95 },
  lastFetch: { status: "never", at: null },
};

function ratesCacheTag() {
  return `rates:${DEFAULT_TENANT_ID}`;
}

export async function getMetalRateProviderConfig(): Promise<MetalRateProviderConfig> {
  const stored = await getSiteSetting<MetalRateProviderConfig>(CONFIG_KEY);
  if (!stored) return DEFAULT_CONFIG;
  return {
    ...DEFAULT_CONFIG,
    ...stored,
    purityFactors: { ...DEFAULT_CONFIG.purityFactors, ...stored.purityFactors },
  };
}

export interface ProviderSettingsInput {
  enabled: boolean;
  refreshIntervalHours: number;
  purityFactors: Record<RateMetalType, number>;
}

/** Admin-facing settings update — validated bounds, not just a raw pass-through. */
export async function updateProviderSettings(
  values: ProviderSettingsInput,
): Promise<ActionResult> {
  const session = await requirePermission("rates.manage");

  if (values.refreshIntervalHours < 1 || values.refreshIntervalHours > 24) {
    return {
      success: false,
      error: "Refresh interval must be between 1 and 24 hours",
    };
  }
  for (const [metal, factor] of Object.entries(values.purityFactors)) {
    if (!Number.isFinite(factor) || factor <= 0 || factor > 1) {
      return {
        success: false,
        error: `Invalid purity factor for ${metal} — must be greater than 0 and at most 1`,
      };
    }
  }

  const current = await getMetalRateProviderConfig();
  const next: MetalRateProviderConfig = {
    ...current,
    enabled: values.enabled,
    refreshIntervalHours: values.refreshIntervalHours,
    purityFactors: values.purityFactors,
  };
  await setSiteSetting(CONFIG_KEY, next);

  logAudit(
    session,
    "updated",
    "metal_rate_provider_config",
    undefined,
    "Pricing provider settings",
    { ...values },
  );
  revalidatePath(ROUTES.admin.rates);
  return { success: true, data: undefined };
}

async function lastKnownRate(metalType: RateMetalType): Promise<number | null> {
  const doc = await MetalRateModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    metalType,
  })
    .sort({ effectiveDate: -1 })
    .select("ratePerGram")
    .lean();
  return doc?.ratePerGram ?? null;
}

/** Anything beyond this is treated as corrupt data (a decimal-place error, a garbled response) and rejected outright rather than trusted. */
const MAX_PLAUSIBLE_CHANGE_PERCENT = 50;
/** Still applied, but flagged — a real one-fetch jump this large is unusual enough that a human should know about it. */
const SIGNIFICANT_CHANGE_PERCENT = 8;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface FetchAndApplyResult {
  success: boolean;
  error?: string;
  warnings?: string[];
  updated?: RateMetalType[];
}

async function recordFetchStatus(
  result: Pick<FetchAndApplyResult, "success" | "error" | "warnings">,
): Promise<void> {
  const current = await getMetalRateProviderConfig();
  await setSiteSetting<MetalRateProviderConfig>(CONFIG_KEY, {
    ...current,
    lastFetch: {
      status: result.success ? "success" : "error",
      at: new Date().toISOString(),
      error: result.error,
      warnings: result.warnings,
    },
  });
}

/**
 * Core sync — fetches live spot prices, converts to the karats/purities
 * this store actually sells, sanity-checks each against the last known
 * rate, and writes new MetalRate docs (source: "api"). Never touches
 * existing rates on failure — the storefront just keeps serving whatever
 * was last written, same graceful-degradation behavior as a day with no
 * manual entry yet.
 *
 * Deliberately does its own permission/auth-agnostic — the two callers
 * (the admin "Refresh Now" button and the cron route) gate access very
 * differently (requirePermission vs. a bearer secret), so that check stays
 * in each caller rather than here.
 */
export async function fetchAndApplyLiveRates(
  actor?: SessionPayload,
): Promise<FetchAndApplyResult> {
  await connectToDatabase();
  const env = getServerEnv();

  if (!env.METALS_DEV_API_KEY) {
    const result: FetchAndApplyResult = {
      success: false,
      error: "METALS_DEV_API_KEY is not configured",
    };
    await recordFetchStatus(result);
    return result;
  }

  const config = await getMetalRateProviderConfig();

  try {
    const fetched = await metalsDevProvider.fetchLatestRates(env.METALS_DEV_API_KEY);
    const effectiveDate = new Date();
    const warnings: string[] = [];
    const toWrite: { metalType: RateMetalType; ratePerGram: number }[] = [];

    for (const metalType of ["gold", "silver", "platinum"] as const) {
      const fineRate = fetched[metalType];
      const factor = config.purityFactors[metalType];
      const adjustedRate = round2(fineRate * factor);

      const previous = await lastKnownRate(metalType);
      if (previous !== null && previous > 0) {
        const changePercent = (Math.abs(adjustedRate - previous) / previous) * 100;
        if (changePercent > MAX_PLAUSIBLE_CHANGE_PERCENT) {
          warnings.push(
            `${metalType}: rejected — ${changePercent.toFixed(1)}% change (₹${previous}/g → ₹${adjustedRate}/g) looks implausible, left unchanged`,
          );
          continue;
        }
        if (changePercent > SIGNIFICANT_CHANGE_PERCENT) {
          warnings.push(
            `${metalType}: large change — ${changePercent.toFixed(1)}% (₹${previous}/g → ₹${adjustedRate}/g)`,
          );
        }
      }

      toWrite.push({ metalType, ratePerGram: adjustedRate });
    }

    if (toWrite.length === 0) {
      const result: FetchAndApplyResult = {
        success: false,
        error: "Every fetched rate failed the sanity check — nothing was updated",
        warnings,
      };
      await recordFetchStatus(result);
      return result;
    }

    await MetalRateModel.create(
      toWrite.map(({ metalType, ratePerGram }) => ({
        tenantId: DEFAULT_TENANT_ID,
        metalType,
        purity: RATE_PURITY[metalType],
        ratePerGram,
        effectiveDate,
        source: "api" as const,
        providerName: metalsDevProvider.name,
      })),
    );

    const metadata = { rates: toWrite, warnings };
    if (actor) {
      logAudit(actor, "updated", "metal_rate", undefined, "Live rate fetch", metadata);
    } else {
      logSystemAudit("updated", "metal_rate", undefined, "Live rate fetch", metadata);
    }

    revalidateTag(ratesCacheTag());
    revalidatePath("/", "layout");
    revalidatePath(ROUTES.admin.rates);

    const result: FetchAndApplyResult = {
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      updated: toWrite.map((w) => w.metalType),
    };
    await recordFetchStatus(result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const result: FetchAndApplyResult = { success: false, error: message };
    await recordFetchStatus(result);

    if (actor) {
      logAudit(actor, "error", "metal_rate", undefined, "Live rate fetch failed", {
        error: message,
      });
    } else {
      logSystemAudit("error", "metal_rate", undefined, "Live rate fetch failed", {
        error: message,
      });
    }

    return result;
  }
}

/** Admin-triggered "Refresh Now" — requires the same permission as manual rate entry. */
export async function refreshRatesNow(): Promise<FetchAndApplyResult> {
  const session = await requirePermission("rates.manage");
  return fetchAndApplyLiveRates(session);
}
