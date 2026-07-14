import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv, clientEnv } from "@/config/env";
import { checkRateLimit } from "@/lib/api/rate-limit";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
  encodeOAuthState,
  googleRedirectUri,
  isSafeRedirectPath,
} from "@/lib/auth/google-oauth";
import { ROUTES } from "@/constants/routes";

function loginWithError(request: NextRequest, error: string): NextResponse {
  const url = new URL(ROUTES.accountLogin, clientEnv.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

/** Kicks off "Continue with Google" — redirects to Google's consent screen. See app/api/auth/google/callback/route.ts for the other half. */
export async function GET(request: NextRequest) {
  const env = getServerEnv();
  if (!env.GOOGLE_CLIENT_ID) {
    return loginWithError(request, "google_not_configured");
  }

  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ipLimit = await checkRateLimit(`google-oauth-init:ip:${ip}`, {
    limit: 30,
    windowMs: 15 * 60_000,
  });
  if (!ipLimit.allowed) {
    return loginWithError(request, "google_rate_limited");
  }

  const redirectParam = request.nextUrl.searchParams.get("redirect");
  const safeRedirect = isSafeRedirectPath(redirectParam)
    ? redirectParam
    : ROUTES.account;

  const csrfToken = crypto.randomBytes(24).toString("hex");
  const state = encodeOAuthState(csrfToken, safeRedirect);

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", googleRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
  });
  return response;
}
