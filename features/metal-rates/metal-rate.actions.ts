"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { MetalRateModel } from "@/features/metal-rates/metal-rate.model";
import {
  dailyRatesFormSchema,
  type DailyRatesFormInput,
} from "@/features/metal-rates/metal-rate.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type {
  MetalRate,
  RateMetalType,
  RateSource,
} from "@/features/metal-rates/metal-rate.types";

/** Default purity each rate applies to — matches how the dashboard's rate form works (PRD §21). */
const DEFAULT_PURITY: Record<RateMetalType, string> = {
  gold: "22K",
  silver: "999",
  platinum: "950",
};

interface CurrentRateEntry {
  ratePerGram: number;
  effectiveDate: string;
  source: RateSource;
}

export interface CurrentRates {
  gold: CurrentRateEntry | null;
  silver: CurrentRateEntry | null;
  platinum: CurrentRateEntry | null;
}

function ratesCacheTag() {
  return `rates:${DEFAULT_TENANT_ID}`;
}

async function fetchCurrentRates(): Promise<CurrentRates> {
  await connectToDatabase();

  const [gold, silver, platinum] = await Promise.all([
    MetalRateModel.findOne({ tenantId: DEFAULT_TENANT_ID, metalType: "gold" })
      .sort({ effectiveDate: -1 })
      .lean(),
    MetalRateModel.findOne({ tenantId: DEFAULT_TENANT_ID, metalType: "silver" })
      .sort({ effectiveDate: -1 })
      .lean(),
    MetalRateModel.findOne({ tenantId: DEFAULT_TENANT_ID, metalType: "platinum" })
      .sort({ effectiveDate: -1 })
      .lean(),
  ]);

  const toEntry = (
    doc: { ratePerGram: number; effectiveDate: Date; source?: RateSource } | null,
  ): CurrentRateEntry | null =>
    doc
      ? {
          ratePerGram: doc.ratePerGram,
          effectiveDate: doc.effectiveDate.toISOString(),
          source: doc.source ?? "manual",
        }
      : null;

  return {
    gold: toEntry(gold),
    silver: toEntry(silver),
    platinum: toEntry(platinum),
  };
}

/**
 * Latest rate per metal type. Used by every product price calculation
 * (lib/pricing) — this is read on essentially every storefront page render,
 * but rates only change once/day via `setDailyRates`, so it's cached and
 * tag-invalidated there rather than hitting Mongo twice on every request.
 */
export const getCurrentRates = unstable_cache(
  fetchCurrentRates,
  ["metal-rates", DEFAULT_TENANT_ID],
  { tags: [ratesCacheTag()] },
);

/** Recent rate entries across both metals — the append-only audit trail (PRD §17) surfaced as history in the admin UI. */
export async function listRateHistory(limit = 20): Promise<MetalRate[]> {
  await requireAdmin();
  await connectToDatabase();

  const docs = await MetalRateModel.find({ tenantId: DEFAULT_TENANT_ID })
    .sort({ effectiveDate: -1 })
    .limit(limit)
    .lean();

  return docs.map((doc) => ({
    id: String(doc._id),
    tenantId: doc.tenantId,
    metalType: doc.metalType as RateMetalType,
    purity: doc.purity,
    ratePerGram: doc.ratePerGram,
    effectiveDate: doc.effectiveDate.toISOString(),
    setByAdminId: doc.setByAdminId ? String(doc.setByAdminId) : undefined,
    source: (doc.source as RateSource) ?? "manual",
    providerName: doc.providerName ?? undefined,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function setDailyRates(
  values: DailyRatesFormInput,
): Promise<ActionResult> {
  const session = await requirePermission("rates.manage");

  const parsed = dailyRatesFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid rate values",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const effectiveDate = new Date();

  await MetalRateModel.create([
    {
      tenantId: DEFAULT_TENANT_ID,
      metalType: "gold",
      purity: DEFAULT_PURITY.gold,
      ratePerGram: parsed.data.goldRatePerGram,
      effectiveDate,
      setByAdminId: session.sub,
      source: "manual",
    },
    {
      tenantId: DEFAULT_TENANT_ID,
      metalType: "silver",
      purity: DEFAULT_PURITY.silver,
      ratePerGram: parsed.data.silverRatePerGram,
      effectiveDate,
      setByAdminId: session.sub,
      source: "manual",
    },
    ...(parsed.data.platinumRatePerGram !== undefined
      ? [
          {
            tenantId: DEFAULT_TENANT_ID,
            metalType: "platinum" as const,
            purity: DEFAULT_PURITY.platinum,
            ratePerGram: parsed.data.platinumRatePerGram,
            effectiveDate,
            setByAdminId: session.sub,
            source: "manual" as const,
          },
        ]
      : []),
  ]);

  logAudit(session, "updated", "metal_rate", undefined, "Daily rates", {
    goldRatePerGram: parsed.data.goldRatePerGram,
    silverRatePerGram: parsed.data.silverRatePerGram,
    platinumRatePerGram: parsed.data.platinumRatePerGram,
  });

  // Every product price is computed at render time from this rate, so
  // revalidating these root paths is enough to refresh the whole catalogue.
  // revalidateTag busts the getCurrentRates() cache itself.
  revalidateTag(ratesCacheTag());
  revalidatePath("/", "layout");
  revalidatePath(ROUTES.admin.rates);

  return { success: true, data: undefined };
}

async function rateAsOf(
  metalType: RateMetalType,
  daysAgo: number,
): Promise<number | null> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysAgo);
  const doc = await MetalRateModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    metalType,
    effectiveDate: { $lte: cutoff },
  })
    .sort({ effectiveDate: -1 })
    .select("ratePerGram")
    .lean();
  return doc?.ratePerGram ?? null;
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export interface RateChangeSummary {
  metalType: RateMetalType;
  current: CurrentRateEntry | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
}

/** Pricing Dashboard headline cards — current rate per metal plus 24h/7d/30d % change, computed by diffing against the nearest prior rate entry (not a running average). */
export async function getRateChangeSummaries(): Promise<RateChangeSummary[]> {
  await requireAdmin();
  await connectToDatabase();

  const rates = await getCurrentRates();
  const metalTypes: RateMetalType[] = ["gold", "silver", "platinum"];

  return Promise.all(
    metalTypes.map(async (metalType) => {
      const current = rates[metalType];
      if (!current) {
        return { metalType, current: null, change24h: null, change7d: null, change30d: null };
      }

      const [prior24h, prior7d, prior30d] = await Promise.all([
        rateAsOf(metalType, 1),
        rateAsOf(metalType, 7),
        rateAsOf(metalType, 30),
      ]);

      return {
        metalType,
        current,
        change24h: prior24h !== null ? percentChange(current.ratePerGram, prior24h) : null,
        change7d: prior7d !== null ? percentChange(current.ratePerGram, prior7d) : null,
        change30d:
          prior30d !== null ? percentChange(current.ratePerGram, prior30d) : null,
      };
    }),
  );
}

export interface RateHistoryPoint {
  label: string;
  value: number;
}

/** Chart data for the Pricing Dashboard's historical trend — every stored rate entry for one metal within the window, not resampled/averaged (rates are entered/fetched at most a few times a day, so there's nothing to downsample). */
export async function getRateHistoryChart(
  metalType: RateMetalType,
  days = 30,
): Promise<RateHistoryPoint[]> {
  await requireAdmin();
  await connectToDatabase();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const docs = await MetalRateModel.find({
    tenantId: DEFAULT_TENANT_ID,
    metalType,
    effectiveDate: { $gte: since },
  })
    .sort({ effectiveDate: 1 })
    .select("ratePerGram effectiveDate")
    .lean();

  return docs.map((doc) => ({
    label: doc.effectiveDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    value: doc.ratePerGram,
  }));
}
