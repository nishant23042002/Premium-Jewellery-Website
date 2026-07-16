import "server-only";
import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { getServerEnv } from "@/config/env";

export const ADMIN_GATE_COOKIE_NAME = "ambika_admin_gate";

/** 180 days — meant to be unlocked once (via the bookmarked /api/admin-gate link) and forgotten, not re-entered per session. */
const GATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
const GATE_TOKEN_EXPIRES_IN = "180d";

interface AdminGatePayload {
  kind: "admin_gate";
}

/** Whether the ADMIN_GATE_SECRET feature is turned on for this deployment at all — unset means /admin behaves exactly as it always has. */
export function isAdminGateEnabled(): boolean {
  return !!getServerEnv().ADMIN_GATE_SECRET;
}

/** Constant-time comparison so response timing can't be used to guess the secret character-by-character. */
export function isValidGateKey(candidate: string): boolean {
  const secret = getServerEnv().ADMIN_GATE_SECRET;
  if (!secret) return false;
  if (candidate.length !== secret.length) return false;
  let mismatch = 0;
  for (let i = 0; i < secret.length; i++) {
    mismatch |= candidate.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function setAdminGateCookie(): Promise<void> {
  const token = signSessionToken<AdminGatePayload>(
    { kind: "admin_gate" },
    GATE_TOKEN_EXPIRES_IN,
  );
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_GATE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_COOKIE_MAX_AGE_SECONDS,
  });
}

/** Middleware-safe check against a raw cookie string (middleware can't use next/headers' cookies()). */
export function isValidGateToken(token: string | undefined): boolean {
  if (!token) return false;
  const payload = verifySessionToken<AdminGatePayload>(token);
  return payload?.kind === "admin_gate";
}
