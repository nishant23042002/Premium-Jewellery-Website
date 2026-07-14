import { type NextRequest, NextResponse } from "next/server";
import { SITE } from "@/constants/site";
import { ROUTES } from "@/constants/routes";
import { clientEnv } from "@/config/env";
import { applyReservationStatusViaEmailAction } from "@/features/reservations/reservation.actions";
import {
  buildWhatsAppLink,
  reservationStatusCustomerMessage,
} from "@/lib/notifications/whatsapp-templates";
import { RESERVATION_STATUS_META } from "@/constants/reservation";

// Genuinely dynamic — must run at request time against live reservation state.
export const dynamic = "force-dynamic";

function page(title: string, bodyHtml: string): NextResponse {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${title} — ${SITE.name}</title>
  </head>
  <body style="margin:0; font-family: Georgia, serif; background: #FAF7F2; color: #241C17; padding: 24px;">
    <div style="max-width: 480px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 32px; text-align: center;">
      <p style="letter-spacing: 0.1em; text-transform: uppercase; font-size: 11px; color: #9A7C46; margin: 0 0 24px;">${SITE.name}</p>
      ${bodyHtml}
    </div>
  </body>
</html>`;
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * Login-free action link handler for the Confirm/Complete/Cancel buttons
 * embedded in the "new reservation" admin email — lets the admin change a
 * reservation's status straight from their inbox, without opening the
 * dashboard. Authorization is the signed token itself (see
 * lib/auth/reservation-action-token.ts), not a session, so this route
 * intentionally has no auth check beyond token verification.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return page(
      "Invalid link",
      `<h1 style="font-size:20px;">Invalid link</h1><p>This action link is missing its token.</p>`,
    );
  }

  const result = await applyReservationStatusViaEmailAction(token);

  if (!result.success) {
    return page(
      "Couldn't update reservation",
      `<h1 style="font-size:20px;">Couldn't update reservation</h1>
       <p>${result.error}</p>
       <p style="margin-top:24px;"><a href="${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.admin.reservations}" style="color:#9A7C46;">Open the admin dashboard</a></p>`,
    );
  }

  const reservation = result.data;
  const statusLabel = RESERVATION_STATUS_META[reservation.status].label;
  const waMessage = reservationStatusCustomerMessage(
    reservation,
    reservation.status,
  );
  const waLink =
    waMessage && reservation.phone
      ? buildWhatsAppLink(reservation.phone, waMessage)
      : null;

  return page(
    "Reservation updated",
    `<h1 style="font-size:20px;">Marked as ${statusLabel}</h1>
     <p>${reservation.name}'s reservation is now <strong>${statusLabel}</strong>.</p>
     ${
       waLink
         ? `<p style="margin-top:24px;"><a href="${waLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#25D366; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-family:sans-serif; font-size:14px;">Send WhatsApp Update</a></p>`
         : ""
     }
     <p style="margin-top:16px;"><a href="${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.admin.reservation(reservation.id)}" style="color:#9A7C46;">View reservation in dashboard</a></p>`,
  );
}
