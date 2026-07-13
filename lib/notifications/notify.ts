import "server-only";
import { sendEmail } from "@/lib/notifications/send-email";
import {
  newReservationAdminEmail,
  reservationCancelledCustomerEmail,
  reservationConfirmedCustomerEmail,
  reservationReceivedCustomerEmail,
} from "@/lib/notifications/email-templates";
import { SITE } from "@/constants/site";
import type {
  Reservation,
  ReservationStatus,
} from "@/features/reservations/reservation.types";

/**
 * Email notification orchestrator for the reservation lifecycle (Phase 6).
 * WhatsApp is deliberately NOT auto-sent here — there's no WhatsApp
 * Business API configured, so that stays a manual "click to send" action
 * in the admin dashboard (see lib/notifications/whatsapp-templates.ts).
 * Email uses the same stubbed `sendEmail` until a provider is wired up.
 */
export async function notifyReservationCreated(
  reservation: Reservation,
): Promise<void> {
  const customerEmail = reservationReceivedCustomerEmail(reservation);
  const adminEmail = newReservationAdminEmail(reservation);

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
  } else if (newStatus === "cancelled") {
    await sendEmail({
      to: reservation.email,
      ...reservationCancelledCustomerEmail(reservation),
    });
  }
}
