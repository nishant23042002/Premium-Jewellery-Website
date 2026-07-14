import { type NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getServerEnv } from "@/config/env";
import {
  fetchAndApplyLiveRates,
  getMetalRateProviderConfig,
} from "@/features/metal-rates/metal-rate-sync.actions";

// Genuinely dynamic — must run at request time, not be statically cached.
export const dynamic = "force-dynamic";

/**
 * Scheduled trigger for the live metal-rate fetch. The actual schedule
 * (vercel.json `crons`) pings this on a fixed cadence (hourly, or daily on
 * Vercel's free plan) — the admin's configured refresh interval is enforced
 * *here*, by comparing against `lastFetch.at`, so the interval setting
 * stays meaningful even though the underlying cron trigger can't be
 * reconfigured per-tenant at runtime.
 *
 * Authenticated via a bearer CRON_SECRET, not an admin session — only the
 * scheduler (or someone manually curling it with the secret) should ever
 * call this.
 */
export async function GET(request: NextRequest) {
  const env = getServerEnv();
  if (!env.CRON_SECRET) {
    return apiError("Scheduled rate refresh is not configured", 503);
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const config = await getMetalRateProviderConfig();
  if (!config.enabled) {
    return apiSuccess({ skipped: true, reason: "Auto-fetch is disabled" });
  }

  if (config.lastFetch.at) {
    const hoursSinceLastFetch =
      (Date.now() - new Date(config.lastFetch.at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastFetch < config.refreshIntervalHours) {
      return apiSuccess({
        skipped: true,
        reason: "Not due yet",
        hoursSinceLastFetch: Math.round(hoursSinceLastFetch * 10) / 10,
        refreshIntervalHours: config.refreshIntervalHours,
      });
    }
  }

  const result = await fetchAndApplyLiveRates();
  return apiSuccess(result, result.success ? 200 : 502);
}
