import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/config/env";
import { logger } from "@/lib/logger";
import type { EmailContent } from "@/lib/notifications/email-templates";

export interface SendEmailParams extends EmailContent {
  to: string;
}

/**
 * Sandbox sender — Resend only lets an unverified account send from this
 * address, and only ever delivers to the email the API key's account is
 * registered with, regardless of `to`. Once a real domain is verified at
 * resend.com/domains, change this to a real address on that domain (e.g.
 * "Shree Ambika Jewellers <reservations@ambikajewellers.com>") and every
 * customer inbox starts receiving these for real — nothing else here changes.
 */
const SANDBOX_FROM = "Shree Ambika Jewellers <onboarding@resend.dev>";

let resendClient: Resend | null = null;

/** Lazily constructed so a missing key doesn't crash module load — only sendEmail() itself needs to know. */
function getResendClient(): Resend | null {
  const { RESEND_API_KEY } = getServerEnv();
  if (!RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Degrades to a logged no-op when RESEND_API_KEY isn't set (e.g. a fresh
 * clone before secrets are configured) — every call site already wraps
 * this in a `.catch()`, so a real send failure surfaces as a logged error
 * rather than breaking the reservation flow that triggered it.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<void> {
  const resend = getResendClient();

  if (!resend) {
    logger.info("email:not-configured", `Would send to ${to}: "${subject}"`, {
      to,
      subject,
      text,
    });
    return;
  }

  const { error } = await resend.emails.send({
    from: SANDBOX_FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    logger.error("email:send-failed", error.message, { to, subject, error });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
