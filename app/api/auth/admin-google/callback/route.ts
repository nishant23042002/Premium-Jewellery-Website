import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv, clientEnv } from "@/config/env";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logger } from "@/lib/logger";
import {
  ADMIN_GOOGLE_OAUTH_STATE_COOKIE,
  adminGoogleRedirectUri,
  decodeAdminOAuthState,
} from "@/lib/auth/admin-google-oauth";
import {
  handleAdminGoogleLogin,
  linkAdminGoogleAccount,
} from "@/features/auth/auth.actions";
import { ROUTES } from "@/constants/routes";

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
}

function redirectWithError(destination: string, error: string): NextResponse {
  const url = new URL(destination, clientEnv.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.delete(ADMIN_GOOGLE_OAUTH_STATE_COOKIE);
  return response;
}

/**
 * The other half of admin "Sign in with Google" / "Link Google Account" —
 * see app/api/auth/admin-google/route.ts. Exchanges the auth code for a
 * profile, then branches on the mode packed into `state`: "login" looks up
 * an existing admin by googleId only (see handleAdminGoogleLogin's comment
 * for why), "link" attaches this Google identity to the CURRENTLY
 * AUTHENTICATED admin's own account. Neither mode ever creates an admin
 * account or links based on email alone.
 */
export async function GET(request: NextRequest) {
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) {
    return redirectWithError(
      ROUTES.admin.login,
      oauthError === "access_denied" ? "google_denied" : "google_signin_failed",
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const storedToken = request.cookies.get(ADMIN_GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!code || !stateParam || !storedToken) {
    return redirectWithError(ROUTES.admin.login, "google_invalid_state");
  }

  const decodedState = decodeAdminOAuthState(stateParam);
  if (!decodedState || decodedState.csrfToken !== storedToken) {
    return redirectWithError(ROUTES.admin.login, "google_invalid_state");
  }

  const destination =
    decodedState.mode === "link" ? ROUTES.admin.settingsSecurity : ROUTES.admin.login;

  const env = getServerEnv();
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return redirectWithError(destination, "google_not_configured");
  }

  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ipLimit = await checkRateLimit(`admin-google-oauth-callback:ip:${ip}`, {
    limit: 20,
    windowMs: 15 * 60_000,
  });
  if (!ipLimit.allowed) {
    return redirectWithError(destination, "google_rate_limited");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: adminGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) {
    logger.error("adminGoogleOAuthCallback", "token exchange failed", {
      status: tokenResponse.status,
    });
    return redirectWithError(destination, "google_signin_failed");
  }
  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );
  if (!profileResponse.ok) {
    logger.error("adminGoogleOAuthCallback", "userinfo fetch failed", {
      status: profileResponse.status,
    });
    return redirectWithError(destination, "google_signin_failed");
  }
  const profile = (await profileResponse.json()) as GoogleUserInfo;

  if (decodedState.mode === "link") {
    // Requires emailVerified too — an unverified Google email is a weaker
    // proof of identity, not something worth attaching to a full-admin
    // account even in the explicit-link flow.
    if (!profile.email_verified) {
      return redirectWithError(destination, "google_email_unverified");
    }

    const result = await linkAdminGoogleAccount(profile.sub);
    if (!result.success) {
      return redirectWithError(destination, "google_link_failed");
    }
    const response = NextResponse.redirect(
      new URL(destination, clientEnv.NEXT_PUBLIC_SITE_URL),
    );
    response.cookies.delete(ADMIN_GOOGLE_OAUTH_STATE_COOKIE);
    return response;
  }

  const result = await handleAdminGoogleLogin({ googleId: profile.sub });
  if (!result.success) {
    const errorCode =
      result.error === "account_deactivated"
        ? "google_account_deactivated"
        : "google_not_linked";
    return redirectWithError(ROUTES.admin.login, errorCode);
  }

  const response = NextResponse.redirect(
    new URL(ROUTES.admin.dashboard, clientEnv.NEXT_PUBLIC_SITE_URL),
  );
  response.cookies.delete(ADMIN_GOOGLE_OAUTH_STATE_COOKIE);
  return response;
}
