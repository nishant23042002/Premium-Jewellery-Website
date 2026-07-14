import "server-only";
import { clientEnv } from "@/config/env";
import { ROUTES } from "@/constants/routes";

/** CSRF-protection cookie for the redirect round trip to Google — short-lived, cleared as soon as the callback consumes it. */
export const GOOGLE_OAUTH_STATE_COOKIE = "ambika_google_oauth_state";
export const GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 600; // 10 minutes — long enough for the consent screen, no longer

export function googleRedirectUri(): string {
  return `${clientEnv.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`;
}

/** Only ever used as a same-origin post-login destination — rejects protocol-relative ("//host") and absolute URLs to prevent this becoming an open redirect. */
export function isSafeRedirectPath(
  path: string | null | undefined,
): path is string {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\")
  );
}

/**
 * Packs the CSRF token and the post-login redirect path into Google's
 * opaque `state` param instead of storing the redirect server-side —
 * Google round-trips `state` back to us unchanged, so this is the only
 * place that needs to remember it.
 */
export function encodeOAuthState(csrfToken: string, redirectPath: string): string {
  return `${csrfToken}.${Buffer.from(redirectPath, "utf8").toString("base64url")}`;
}

export function decodeOAuthState(
  state: string,
): { csrfToken: string; redirectPath: string } | null {
  const dotIndex = state.indexOf(".");
  if (dotIndex === -1) return null;

  const csrfToken = state.slice(0, dotIndex);
  const encodedRedirect = state.slice(dotIndex + 1);
  if (!csrfToken || !encodedRedirect) return null;

  try {
    const decoded = Buffer.from(encodedRedirect, "base64url").toString("utf8");
    return {
      csrfToken,
      redirectPath: isSafeRedirectPath(decoded) ? decoded : ROUTES.account,
    };
  } catch {
    return null;
  }
}
