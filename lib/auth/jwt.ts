import jwt from "jsonwebtoken";
import { getServerEnv } from "@/config/env";
import type { SessionPayload } from "@/features/auth/admin-user.types";

/**
 * Generic over the payload shape — shared by the admin session (`SessionPayload`)
 * and the customer session (`CustomerSessionPayload`), which are separate JWTs
 * in separate cookies but use the same secret/signing mechanics.
 */
export function signSessionToken<T extends object>(payload: T): string {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getServerEnv();
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifySessionToken<T extends object = SessionPayload>(
  token: string,
): T | null {
  const { JWT_SECRET } = getServerEnv();
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}
