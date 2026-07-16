import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { isValidGateKey, setAdminGateCookie } from "@/lib/auth/admin-gate";
import { ROUTES } from "@/constants/routes";

/**
 * One-time "unlock" link for the hidden admin panel — see middleware.ts and
 * lib/auth/admin-gate.ts. Visiting this with the correct ?key= sets a
 * long-lived cookie and redirects into the real login page; anything else
 * (wrong key, or /admin/* without ever having visited this) gets a 404
 * indistinguishable from a genuinely nonexistent page — an automated scanner
 * has nothing to probe for. This is a defense-in-depth layer on top of the
 * real session/password auth in lib/auth/session.ts, not a replacement for it.
 */
export async function GET(request: NextRequest) {
  const notFound = () => new NextResponse(null, { status: 404 });

  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ipLimit = await checkRateLimit(`admin-gate:ip:${ip}`, {
    limit: 8,
    windowMs: 60 * 60_000,
  });
  if (!ipLimit.allowed) {
    return notFound();
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key || !isValidGateKey(key)) {
    return notFound();
  }

  await setAdminGateCookie();
  return NextResponse.redirect(new URL(ROUTES.admin.login, request.url));
}
