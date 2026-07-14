import { SITE } from "@/constants/site";
import { formatDate, formatWeight } from "@/lib/utils/format";
import type {
  Reservation,
  ReservationStatus,
} from "@/features/reservations/reservation.types";

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

export function reservationCompletedCustomerMessage(
  reservation: Reservation,
): string {
  return (
    `Hi ${reservation.name}, thank you for visiting ${SITE.name}! ` +
    `We hope you enjoyed your visit on ${formatDate(reservation.preferredDate)}. ` +
    `We'd love to welcome you again soon — call us at ${SITE.phoneDisplay} anytime.`
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

/**
 * The product-detail-page "WhatsApp Enquiry" button used to send a single
 * generic line — this builds a proper letter-style message instead, with
 * the customer's identity (when logged in), the piece's specs, and links
 * to the product page/photo. `wa.me` links can only pre-fill *text*, so
 * the "photo attached" the user asked for is a direct link the recipient
 * can tap to open — there's no way to programmatically attach a file to a
 * `wa.me` deep link.
 */
export function productEnquiryWhatsAppMessage(input: {
  productName: string;
  skuCode: string;
  metalType: string;
  purity: string;
  netWeightGrams: number;
  productUrl: string;
  productImageUrl?: string;
  customerName?: string;
  customerEmail?: string;
}): string {
  const greeting = input.customerName
    ? `Hello, my name is ${input.customerName}${input.customerEmail ? ` (${input.customerEmail})` : ""}.`
    : "Hello,";

  const lines = [
    greeting,
    "",
    `I'm writing to enquire about the following piece from ${SITE.name}:`,
    "",
    `*${input.productName}*`,
    `SKU: ${input.skuCode}`,
    `${input.purity} ${input.metalType}, ${formatWeight(input.netWeightGrams)}`,
    "",
  ];

  if (input.productImageUrl) {
    lines.push(`Photo: ${input.productImageUrl}`);
  }
  lines.push(`Product page: ${input.productUrl}`, "");
  lines.push(
    "Could you please share more details on current availability, pricing, and customization options? I'd appreciate your response at your earliest convenience.",
    "",
    "Thank you.",
  );

  return lines.join("\n");
}

/** Looks up the right customer-facing message for a status change — used anywhere a "Send WhatsApp Update" link is offered (admin dashboard, the email-action confirmation page). Returns null for "pending" since there's no customer-facing message for a reopen. */
export function reservationStatusCustomerMessage(
  reservation: Reservation,
  status: ReservationStatus,
): string | null {
  switch (status) {
    case "confirmed":
      return reservationConfirmedCustomerMessage(reservation);
    case "completed":
      return reservationCompletedCustomerMessage(reservation);
    case "cancelled":
      return reservationCancelledCustomerMessage(reservation);
    default:
      return null;
  }
}

export function newReservationAdminMessage(reservation: Reservation): string {
  return (
    `New reservation request:\n${reservation.name} — ${reservation.phone}\n` +
    `${formatDate(reservation.preferredDate)} (${reservation.preferredTimeSlot})` +
    `${productList(reservation)}`
  );
}
