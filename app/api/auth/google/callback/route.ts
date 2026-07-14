import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv, clientEnv } from "@/config/env";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logger } from "@/lib/logger";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  decodeOAuthState,
  googleRedirectUri,
} from "@/lib/auth/google-oauth";
import { handleGoogleSignIn } from "@/features/customer-auth/customer-auth.actions";
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
  name?: string;
}

function redirectWithError(error: string): NextResponse {
  const url = new URL(ROUTES.accountLogin, clientEnv.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  return response;
}

/** The other half of "Continue with Google" — see app/api/auth/google/route.ts. Exchanges the auth code for a profile, then hands off to handleGoogleSignIn for the find/link/create-account logic. */
export async function GET(request: NextRequest) {
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) {
    return redirectWithError(
      oauthError === "access_denied" ? "google_denied" : "google_signin_failed",
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const storedToken = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!code || !stateParam || !storedToken) {
    return redirectWithError("google_invalid_state");
  }

  const decodedState = decodeOAuthState(stateParam);
  if (!decodedState || decodedState.csrfToken !== storedToken) {
    return redirectWithError("google_invalid_state");
  }

  const env = getServerEnv();
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return redirectWithError("google_not_configured");
  }

  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ipLimit = await checkRateLimit(`google-oauth-callback:ip:${ip}`, {
    limit: 20,
    windowMs: 15 * 60_000,
  });
  if (!ipLimit.allowed) {
    return redirectWithError("google_rate_limited");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) {
    logger.error("googleOAuthCallback", "token exchange failed", {
      status: tokenResponse.status,
    });
    return redirectWithError("google_signin_failed");
  }
  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );
  if (!profileResponse.ok) {
    logger.error("googleOAuthCallback", "userinfo fetch failed", {
      status: profileResponse.status,
    });
    return redirectWithError("google_signin_failed");
  }
  const profile = (await profileResponse.json()) as GoogleUserInfo;

  if (!profile.email) {
    return redirectWithError("google_no_email");
  }

  const result = await handleGoogleSignIn({
    googleId: profile.sub,
    email: profile.email,
    emailVerified: profile.email_verified === true,
    name: profile.name?.trim() || profile.email.split("@")[0],
  });

  if (!result.success) {
    const errorCode =
      result.error === "email_not_verified"
        ? "google_email_unverified"
        : result.error === "account_deactivated"
          ? "google_account_deactivated"
          : "google_signin_failed";
    return redirectWithError(errorCode);
  }

  const response = NextResponse.redirect(
    new URL(decodedState.redirectPath, clientEnv.NEXT_PUBLIC_SITE_URL),
  );
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  return response;
}
