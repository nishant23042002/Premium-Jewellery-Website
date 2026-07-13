import { type NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCurrentRates } from "@/features/metal-rates/metal-rate.actions";

// Reads the DB on every request rather than being statically prerendered —
// this is genuinely dynamic, DB-backed data, so it must not run at build
// time (there's no database reachable during `next build`).
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identifier =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  const rateLimit = checkRateLimit(`rates-current:${identifier}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return apiError("Too many requests. Please try again in a minute.", 429);
  }

  const rates = await getCurrentRates();
  return apiSuccess(rates);
}
