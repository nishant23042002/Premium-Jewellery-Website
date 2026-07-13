import "server-only";
import { logger } from "@/lib/logger";
import type { EmailContent } from "@/lib/notifications/email-templates";

export interface SendEmailParams extends EmailContent {
  to: string;
}

/**
 * NOT WIRED TO A REAL PROVIDER YET. No email service (Resend, SES,
 * Nodemailer + SMTP, etc.) is configured for this project — there's no API
 * key to send with. This function exists so every call site (reservation
 * create/status-change) already has the correct integration point; swap
 * the body for a real provider call and nothing upstream needs to change.
 *
 * For now it logs what *would* be sent, so the notification pipeline is
 * still observable and testable end-to-end without a live provider.
 */
export async function sendEmail({
  to,
  subject,
  text,
}: SendEmailParams): Promise<void> {
  logger.info("email:not-configured", `Would send to ${to}: "${subject}"`, {
    to,
    subject,
    text,
  });
}
