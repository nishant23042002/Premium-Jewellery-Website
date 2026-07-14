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

export function passwordResetEmail(
  name: string,
  resetUrl: string,
): EmailContent {
  const subject = `Reset your password — ${SITE.name}`;
  const html = baseLayout(`
    <h1 style="font-size: 20px;">Reset your password</h1>
    <p>Hi ${name}, we received a request to reset your account password. This link expires in 1 hour and can only be used once.</p>
    <p style="margin-top: 20px;"><a href="${resetUrl}" style="display:inline-block; background:#9A7C46; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-family:Arial,sans-serif; font-size:14px;">Reset Password</a></p>
    <p style="margin-top: 16px; font-size: 12px; color: #6b6259;">If you didn't request this, you can safely ignore this email — your password won't change unless you click the link above and set a new one.</p>
  `);
  const text = `Hi ${name}, reset your ${SITE.name} password here (expires in 1 hour): ${resetUrl}\n\nIf you didn't request this, ignore this email.`;
  return { subject, html, text };
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

export function reservationCompletedCustomerEmail(
  reservation: Reservation,
): EmailContent {
  const subject = `Thank you for visiting — ${SITE.name}`;
  const html = baseLayout(`
    <h1 style="font-size: 20px;">Thank you, ${reservation.name}</h1>
    <p>We hope you enjoyed your visit to ${SITE.name} on ${formatDate(reservation.preferredDate)}.</p>
    <p>We'd love to welcome you again soon — call us at ${SITE.phoneDisplay} anytime.</p>
  `);
  const text = `Thank you for visiting ${SITE.name} on ${formatDate(reservation.preferredDate)}. We hope to see you again soon.`;
  return { subject, html, text };
}

function actionButton(label: string, url: string, color: string): string {
  return `<a href="${url}" style="display:inline-block; background:${color}; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-family:Arial,sans-serif; font-size:14px; margin:4px 8px 4px 0;">${label}</a>`;
}

export interface ReservationAdminActionLinks {
  confirmUrl: string;
  cancelUrl: string;
}

/**
 * `actionLinks` is optional so this template still works anywhere an admin
 * email is sent without a signed-token context available — but the
 * reservation notification pipeline always supplies it, since that's the
 * whole point (confirm/cancel straight from the inbox, no dashboard login).
 */
export function newReservationAdminEmail(
  reservation: Reservation,
  actionLinks?: ReservationAdminActionLinks,
): EmailContent {
  const subject = `New reservation request from ${reservation.name}`;
  const html = baseLayout(`
    <h1 style="font-size: 20px;">New reservation request</h1>
    <p>${reservation.name} — ${reservation.phone}</p>
    <p>${formatDate(reservation.preferredDate)} (${reservation.preferredTimeSlot})</p>
    ${productLines(reservation)}
    ${reservation.message ? `<p>Message: ${reservation.message}</p>` : ""}
    ${
      actionLinks
        ? `<div style="margin-top: 20px;">
            ${actionButton("Confirm", actionLinks.confirmUrl, "#9A7C46")}
            ${actionButton("Cancel", actionLinks.cancelUrl, "#B3423E")}
          </div>
          <p style="font-size: 12px; color: #6b6259; margin-top: 12px;">Or open the full reservation in the admin dashboard to add a note or mark it completed after the visit.</p>`
        : ""
    }
  `);
  const text = `New reservation from ${reservation.name} (${reservation.phone}) for ${formatDate(reservation.preferredDate)}.`;
  return { subject, html, text };
}
