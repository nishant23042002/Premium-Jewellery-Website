import { type NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { createEnquiry } from "@/features/enquiries/enquiry.actions";

/**
 * Public endpoint for non-Next clients (e.g. a future WhatsApp webhook
 * relay). The storefront's own enquiry form calls the `createEnquiry`
 * Server Action directly (PRD §31); this route exists for callers outside
 * the Next.js app boundary.
 */
export async function POST(request: NextRequest) {
  const identifier =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  const rateLimit = checkRateLimit(`enquiries:${identifier}`, {
    limit: 5,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return apiError("Too many requests. Please try again in a minute.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const result = await createEnquiry(
    body as Parameters<typeof createEnquiry>[0],
  );

  if (!result.success) {
    return apiError(result.error, 422);
  }

  return apiSuccess(result.data, 201);
}
