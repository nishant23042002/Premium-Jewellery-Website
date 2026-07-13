import { SITE } from "@/constants/site";
import { formatDate } from "@/lib/utils/format";
import type { Reservation } from "@/features/reservations/reservation.types";

/**
 * WhatsApp message templates + `wa.me` deep-link builder (Phase 6). No
 * WhatsApp Business API is configured, so this stays a real, working
 * "click to send" pattern — the admin dashboard opens a prefilled chat for
 * staff to send manually, same approach as the product enquiry CTA.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function productList(reservation: Reservation): string {
  if (reservation.products.length === 0) return "";
  return `\nPieces: ${reservation.products.map((p) => p.name).join(", ")}`;
}

export function reservationReceivedCustomerMessage(
  reservation: Reservation,
): string {
  return (
    `Hi ${reservation.name}, thank you for your reservation request at ${SITE.name}! ` +
    `We've received your request for ${formatDate(reservation.preferredDate)} (${reservation.preferredTimeSlot}).` +
    `${productList(reservation)}\n\nWe'll confirm your slot shortly.`
  );
}

export function reservationConfirmedCustomerMessage(
  reservation: Reservation,
): string {
  return (
    `Hi ${reservation.name}, your visit to ${SITE.name} is confirmed for ` +
    `${formatDate(reservation.preferredDate)} (${reservation.preferredTimeSlot}).` +
    `${productList(reservation)}\n\nWe look forward to seeing you! Call us at ${SITE.phoneDisplay} if you need to reschedule.`
  );
}

export function reservationCancelledCustomerMessage(
  reservation: Reservation,
): string {
  return (
    `Hi ${reservation.name}, your reservation at ${SITE.name} for ${formatDate(reservation.preferredDate)} ` +
    `has been cancelled. If this wasn't expected, please call us at ${SITE.phoneDisplay}.`
  );
}

export function newReservationAdminMessage(reservation: Reservation): string {
  return (
    `New reservation request:\n${reservation.name} — ${reservation.phone}\n` +
    `${formatDate(reservation.preferredDate)} (${reservation.preferredTimeSlot})` +
    `${productList(reservation)}`
  );
}
