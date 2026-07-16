import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  ADMIN_GATE_COOKIE_NAME,
  isAdminGateEnabled,
  isValidGateToken,
} from "@/lib/auth/admin-gate";
import type { SessionPayload } from "@/features/auth/admin-user.types";

// Vercel Functions now run Middleware on full Node.js (Fluid Compute), so
// jsonwebtoken's Node crypto APIs work here without an Edge-only JWT lib.
export const runtime = "nodejs";

const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Opt-in extra layer (ADMIN_GATE_SECRET) — when configured, every /admin
  // path, including /admin/login itself, is invisible without first
  // visiting /api/admin-gate?key=... to obtain the gate cookie. Rewritten
  // (not redirected) to a path outside /admin entirely, so it renders the
  // same generic site-wide 404 as any other mistyped URL — not the
  // admin-branded not-found.tsx, which would itself confirm an admin panel
  // exists here even to a visitor without the gate.
  if (isAdminGateEnabled()) {
    const gateToken = request.cookies.get(ADMIN_GATE_COOKIE_NAME)?.value;
    if (!isValidGateToken(gateToken)) {
      return NextResponse.rewrite(new URL("/page-not-found-9f3k2", request.url));
    }
  }

  if (PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token
    ? verifySessionToken<SessionPayload>(token)
    : null;

  // `kind` check, not just "does a valid signature exist" — a customer
  // session token (same signing secret) must not pass this gate.
  if (!session || session.kind !== "admin") {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
