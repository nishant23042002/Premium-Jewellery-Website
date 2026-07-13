import { SITE } from "@/constants/site";
import { formatDate } from "@/lib/utils/format";
import type { Reservation } from "@/features/reservations/reservation.types";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function baseLayout(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: Georgia, serif; background: #FAF7F2; padding: 24px; color: #241C17;">
    <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px;">
      <p style="letter-spacing: 0.1em; text-transform: uppercase; font-size: 11px; color: #9A7C46; margin-bottom: 16px;">${SITE.name}</p>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #6b6259;">${SITE.address.full} · ${SITE.phoneDisplay}</p>
    </div>
  </body>
</html>`;
}

function productLines(reservation: Reservation): string {
  if (reservation.products.length === 0) return "";
  return `<p>Pieces: ${reservation.products.map((p) => p.name).join(", ")}</p>`;
}

export function reservationReceivedCustomerEmail(
  reservation: Reservation,
): EmailContent {
  const subject = `We've received your reservation request — ${SITE.name}`;
  const html = baseLayout(`
    <h1 style="font-size: 20px;">Thank you, ${reservation.name}</h1>
    <p>We've received your request to visit on <strong>${formatDate(reservation.preferredDate)}</strong> (${reservation.preferredTimeSlot}).</p>
    ${productLines(reservation)}
    <p>We'll confirm your slot shortly — no action needed from you right now.</p>
  `);
  const text = `Thank you, ${reservation.name}. We've received your reservation request for ${formatDate(reservation.preferredDate)} (${reservation.preferredTimeSlot}). We'll confirm shortly.`;
  return { subject, html, text };
}

export function reservationConfirmedCustomerEmail(
  reservation: Reservation,
): EmailContent {
  const subject = `Your visit is confirmed — ${SITE.name}`;
  const html = baseLayout(`
    <h1 style="font-size: 20px;">You're all set, ${reservation.name}</h1>
    <p>Your visit is confirmed for <strong>${formatDate(reservation.preferredDate)}</strong> (${reservation.preferredTimeSlot}).</p>
    ${productLines(reservation)}
    <p>We look forward to seeing you.</p>
  `);
  const text = `Your visit to ${SITE.name} is confirmed for ${formatDate(reservation.preferredDate)} (${reservation.preferredTimeSlot}).`;
  return { subject, html, text };
}

export function reservationCancelledCustomerEmail(
  reservation: Reservation,
): EmailContent {
  const subject = `Your reservation was cancelled — ${SITE.name}`;
  const html = baseLayout(`
    <h1 style="font-size: 20px;">Reservation cancelled</h1>
    <p>Your reservation for ${formatDate(reservation.preferredDate)} (${reservation.preferredTimeSlot}) has been cancelled.</p>
    <p>If this wasn't expected, please call us at ${SITE.phoneDisplay}.</p>
  `);
  const text = `Your reservation at ${SITE.name} for ${formatDate(reservation.preferredDate)} has been cancelled.`;
  return { subject, html, text };
}

export function newReservationAdminEmail(
  reservation: Reservation,
): EmailContent {
  const subject = `New reservation request from ${reservation.name}`;
  const html = baseLayout(`
    <h1 style="font-size: 20px;">New reservation request</h1>
    <p>${reservation.name} — ${reservation.phone}</p>
    <p>${formatDate(reservation.preferredDate)} (${reservation.preferredTimeSlot})</p>
    ${productLines(reservation)}
    ${reservation.message ? `<p>Message: ${reservation.message}</p>` : ""}
  `);
  const text = `New reservation from ${reservation.name} (${reservation.phone}) for ${formatDate(reservation.preferredDate)}.`;
  return { subject, html, text };
}
