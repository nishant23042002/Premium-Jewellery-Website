import "server-only";
import { sendEmail } from "@/lib/notifications/send-email";
import {
  newReservationAdminEmail,
  reservationCancelledCustomerEmail,
  reservationCompletedCustomerEmail,
  reservationConfirmedCustomerEmail,
  reservationReceivedCustomerEmail,
} from "@/lib/notifications/email-templates";
import { SITE } from "@/constants/site";
import { clientEnv } from "@/config/env";
import { signReservationActionToken } from "@/lib/auth/reservation-action-token";
import type {
  Reservation,
  ReservationStatus,
} from "@/features/reservations/reservation.types";

/**
 * Email notification orchestrator for the reservation lifecycle (Phase 6).
 * WhatsApp is deliberately NOT auto-sent here — there's no WhatsApp
 * Business API configured, so that stays a manual "click to send" action
 * in the admin dashboard (see lib/notifications/whatsapp-templates.ts).
 */

function reservationActionUrl(
  reservationId: string,
  targetStatus: ReservationStatus,
): string {
  const token = signReservationActionToken(reservationId, targetStatus);
  return `${clientEnv.NEXT_PUBLIC_SITE_URL}/api/reservations/action?token=${token}`;
}

export async function notifyReservationCreated(
  reservation: Reservation,
): Promise<void> {
  const customerEmail = reservationReceivedCustomerEmail(reservation);
  // A freshly-created reservation is always "pending", whose only legal
  // transitions are confirmed/cancelled (RESERVATION_STATUS_TRANSITIONS) —
  // "completed" only makes sense after a visit actually happens, which the
  // admin dashboard (not this initial email) handles.
  const adminEmail = newReservationAdminEmail(reservation, {
    confirmUrl: reservationActionUrl(reservation.id, "confirmed"),
    cancelUrl: reservationActionUrl(reservation.id, "cancelled"),
  });

  await Promise.all([
    reservation.email
      ? sendEmail({ to: reservation.email, ...customerEmail })
      : Promise.resolve(),
    sendEmail({ to: SITE.adminEmail, ...adminEmail }),
  ]);
}

export async function notifyReservationStatusChanged(
  reservation: Reservation,
  newStatus: ReservationStatus,
): Promise<void> {
  if (!reservation.email) return;

  if (newStatus === "confirmed") {
    await sendEmail({
      to: reservation.email,
      ...reservationConfirmedCustomerEmail(reservation),
    });
  } else if (newStatus === "completed") {
    await sendEmail({
      to: reservation.email,
      ...reservationCompletedCustomerEmail(reservation),
    });
  } else if (newStatus === "cancelled") {
    await sendEmail({
      to: reservation.email,
      ...reservationCancelledCustomerEmail(reservation),
    });
  }
}
