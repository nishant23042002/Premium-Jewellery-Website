import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv, clientEnv } from "@/config/env";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getSession } from "@/lib/auth/session";
import {
  ADMIN_GOOGLE_OAUTH_STATE_COOKIE,
  ADMIN_GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
  adminGoogleRedirectUri,
  encodeAdminOAuthState,
  type AdminGoogleOAuthMode,
} from "@/lib/auth/admin-google-oauth";
import { ROUTES } from "@/constants/routes";

function loginWithError(request: NextRequest, error: string): NextResponse {
  const url = new URL(ROUTES.admin.login, clientEnv.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

function securityWithError(request: NextRequest, error: string): NextResponse {
  const url = new URL(ROUTES.admin.settingsSecurity, clientEnv.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

/**
 * Kicks off admin "Sign in with Google" (?mode=login, the default — from
 * the login page, no session required) or "Link Google Account" (?mode=link
 * — from Settings > Security, requires an existing admin session; the
 * callback re-verifies that session rather than trusting this check alone).
 * See app/api/auth/admin-google/callback/route.ts for the other half.
 */
export async function GET(request: NextRequest) {
  const env = getServerEnv();
  if (!env.GOOGLE_CLIENT_ID) {
    return loginWithError(request, "google_not_configured");
  }

  const modeParam = request.nextUrl.searchParams.get("mode");
  const mode: AdminGoogleOAuthMode = modeParam === "link" ? "link" : "login";

  if (mode === "link") {
    const session = await getSession();
    if (!session) {
      return loginWithError(request, "session_required");
    }
  }

  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ipLimit = await checkRateLimit(`admin-google-oauth-init:ip:${ip}`, {
    limit: 30,
    windowMs: 15 * 60_000,
  });
  if (!ipLimit.allowed) {
    return mode === "link"
      ? securityWithError(request, "google_rate_limited")
      : loginWithError(request, "google_rate_limited");
  }

  const csrfToken = crypto.randomBytes(24).toString("hex");
  const state = encodeAdminOAuthState(csrfToken, mode);

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", adminGoogleRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(ADMIN_GOOGLE_OAUTH_STATE_COOKIE, csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
  });
  return response;
}
