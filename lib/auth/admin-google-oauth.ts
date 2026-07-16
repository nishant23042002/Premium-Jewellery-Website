import "server-only";
import { clientEnv } from "@/config/env";

/**
 * Admin twin of lib/auth/google-oauth.ts, kept as a separate module (own
 * cookie name, own redirect URI, own state shape) rather than sharing the
 * customer one — admin Google sign-in has a materially different trust
 * model (explicit-link-only, see admin-user.model.ts's googleId comment)
 * and mixing the two flows' state through one code path risked a login-mode
 * request being misread as a link-mode one or vice versa.
 */
export const ADMIN_GOOGLE_OAUTH_STATE_COOKIE = "ambika_admin_google_oauth_state";
export const ADMIN_GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 600; // 10 minutes

export type AdminGoogleOAuthMode = "login" | "link";

export function adminGoogleRedirectUri(): string {
  return `${clientEnv.NEXT_PUBLIC_SITE_URL}/api/auth/admin-google/callback`;
}

export function encodeAdminOAuthState(
  csrfToken: string,
  mode: AdminGoogleOAuthMode,
): string {
  return `${csrfToken}.${mode}`;
}

export function decodeAdminOAuthState(
  state: string,
): { csrfToken: string; mode: AdminGoogleOAuthMode } | null {
  const dotIndex = state.indexOf(".");
  if (dotIndex === -1) return null;

  const csrfToken = state.slice(0, dotIndex);
  const modeRaw = state.slice(dotIndex + 1);
  if (!csrfToken || (modeRaw !== "login" && modeRaw !== "link")) return null;

  return { csrfToken, mode: modeRaw };
}
