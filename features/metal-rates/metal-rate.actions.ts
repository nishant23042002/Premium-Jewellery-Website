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
} from "@/features/metal-rates/metal-rate.types";

/** Default purity each rate applies to — matches how the dashboard's 2-field form works (PRD §21). */
const DEFAULT_PURITY: Record<RateMetalType, string> = {
  gold: "22K",
  silver: "999",
};

export interface CurrentRates {
  gold: { ratePerGram: number; effectiveDate: string } | null;
  silver: { ratePerGram: number; effectiveDate: string } | null;
}

function ratesCacheTag() {
  return `rates:${DEFAULT_TENANT_ID}`;
}

async function fetchCurrentRates(): Promise<CurrentRates> {
  await connectToDatabase();

  const [gold, silver] = await Promise.all([
    MetalRateModel.findOne({ tenantId: DEFAULT_TENANT_ID, metalType: "gold" })
      .sort({ effectiveDate: -1 })
      .lean(),
    MetalRateModel.findOne({ tenantId: DEFAULT_TENANT_ID, metalType: "silver" })
      .sort({ effectiveDate: -1 })
      .lean(),
  ]);

  return {
    gold: gold
      ? {
          ratePerGram: gold.ratePerGram,
          effectiveDate: gold.effectiveDate.toISOString(),
        }
      : null,
    silver: silver
      ? {
          ratePerGram: silver.ratePerGram,
          effectiveDate: silver.effectiveDate.toISOString(),
        }
      : null,
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
    setByAdminId: String(doc.setByAdminId),
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
    },
    {
      tenantId: DEFAULT_TENANT_ID,
      metalType: "silver",
      purity: DEFAULT_PURITY.silver,
      ratePerGram: parsed.data.silverRatePerGram,
      effectiveDate,
      setByAdminId: session.sub,
    },
  ]);

  logAudit(session, "updated", "metal_rate", undefined, "Daily rates", {
    goldRatePerGram: parsed.data.goldRatePerGram,
    silverRatePerGram: parsed.data.silverRatePerGram,
  });

  // Every product price is computed at render time from this rate, so
  // revalidating these root paths is enough to refresh the whole catalogue.
  // revalidateTag busts the getCurrentRates() cache itself.
  revalidateTag(ratesCacheTag());
  revalidatePath("/", "layout");
  revalidatePath(ROUTES.admin.rates);

  return { success: true, data: undefined };
}
