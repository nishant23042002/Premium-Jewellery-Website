import jwt from "jsonwebtoken";
import { getServerEnv } from "@/config/env";
import type { ReservationStatus } from "@/features/reservations/reservation.types";

const PURPOSE = "reservation_email_action";

/** Independent of the admin session's JWT_EXPIRES_IN — an email sitting unread in an inbox for a few days should still work, but the link shouldn't stay valid forever. */
const TOKEN_EXPIRES_IN = "7d";

export interface ReservationActionTokenPayload {
  purpose: typeof PURPOSE;
  reservationId: string;
  targetStatus: ReservationStatus;
}

export function signReservationActionToken(
  reservationId: string,
  targetStatus: ReservationStatus,
): string {
  const { JWT_SECRET } = getServerEnv();
  const payload: ReservationActionTokenPayload = {
    purpose: PURPOSE,
    reservationId,
    targetStatus,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

/**
 * Verifies both the signature and the `purpose` field, so a stolen admin
 * session JWT can't be replayed here and vice versa — the two token types
 * are structurally different but share a secret, so the purpose tag is the
 * only thing keeping them from being interchangeable.
 */
export function verifyReservationActionToken(
  token: string,
): ReservationActionTokenPayload | null {
  const { JWT_SECRET } = getServerEnv();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Partial<ReservationActionTokenPayload>;
    if (decoded.purpose !== PURPOSE || !decoded.reservationId || !decoded.targetStatus) {
      return null;
    }
    return decoded as ReservationActionTokenPayload;
  } catch {
    return null;
  }
}
