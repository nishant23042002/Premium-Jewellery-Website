import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import type { SessionPayload } from "@/features/auth/admin-user.types";

// Vercel Functions now run Middleware on full Node.js (Fluid Compute), so
// jsonwebtoken's Node crypto APIs work here without an Edge-only JWT lib.
export const runtime = "nodejs";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
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
