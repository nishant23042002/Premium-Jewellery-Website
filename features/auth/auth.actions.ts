"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongoose";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, requireAdmin } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logger } from "@/lib/logger";
import { clientEnv } from "@/config/env";
import { sendEmail } from "@/lib/notifications/send-email";
import { passwordResetEmail } from "@/lib/notifications/email-templates";
import {
  loginFormSchema,
  requestAdminPasswordResetSchema,
  resetAdminPasswordSchema,
  type LoginFormValues,
  type RequestAdminPasswordResetInput,
  type ResetAdminPasswordInput,
} from "@/features/auth/auth.schema";
import { AdminUserModel } from "@/features/auth/admin-user.model";
import { AdminPasswordResetTokenModel } from "@/features/auth/admin-password-reset-token.model";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";

const ADMIN_PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60_000;

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for") ??
    headerList.get("x-real-ip") ??
    "unknown"
  );
}

export async function loginAction(
  values: LoginFormValues,
): Promise<ActionResult<{ role: string }>> {
  const parsed = loginFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid credentials",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ip = await getClientIp();
  const email = parsed.data.email.toLowerCase();

  // Lock out by email AND by IP so an attacker can't work around either
  // limit alone (spraying many emails from one IP, or one email from many
  // IPs/proxies). 5 attempts / 15 min, matching the login form's own retry
  // expectations for a genuine mistyped password.
  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit(`login:email:${email}`, { limit: 5, windowMs: 15 * 60_000 }),
    checkRateLimit(`login:ip:${ip}`, { limit: 20, windowMs: 15 * 60_000 }),
  ]);
  if (!emailLimit.allowed || !ipLimit.allowed) {
    logger.warn("loginAction", "rate limited", { email, ip });
    return {
      success: false,
      error: "Too many login attempts. Please try again in a few minutes.",
    };
  }

  await connectToDatabase();

  const admin = await AdminUserModel.findOne({
    email,
  }).select("+passwordHash");

  // Same generic error whether the email doesn't exist or the password is
  // wrong — avoids leaking which emails are registered admins.
  if (!admin) {
    return { success: false, error: "Invalid email or password" };
  }

  const isValid = await verifyPassword(
    parsed.data.password,
    admin.passwordHash,
  );
  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }

  if (admin.isActive === false) {
    return { success: false, error: "This account has been deactivated" };
  }

  await createSession({
    sub: admin._id.toString(),
    tenantId: admin.tenantId,
    email: admin.email,
    role: admin.role as "owner" | "staff",
    roleSlug: admin.roleSlug ?? undefined,
    kind: "admin",
  });

  return { success: true, data: { role: admin.role } };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}

/**
 * Admin-side twin of requestPasswordResetAction (features/customer-auth/
 * customer-auth.actions.ts) — same shape deliberately: always returns a
 * generic success regardless of whether the email is a real admin, is
 * active, or is rate-limited, so a stranger probing this form learns
 * nothing about which emails have admin access here. There is still no
 * public admin sign-up anywhere — this only ever resets the password on an
 * admin account that already exists.
 */
export async function requestAdminPasswordResetAction(
  values: RequestAdminPasswordResetInput,
): Promise<ActionResult> {
  const genericResult: ActionResult = { success: true, data: undefined };

  const parsed = requestAdminPasswordResetSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Enter a valid email address",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const ip = await getClientIp();
  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit(`admin-password-reset:ip:${ip}`, { limit: 10, windowMs: 60 * 60_000 }),
    checkRateLimit(`admin-password-reset:email:${email}`, { limit: 3, windowMs: 60 * 60_000 }),
  ]);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    logger.warn("requestAdminPasswordResetAction", "rate limited", { email, ip });
    return genericResult;
  }

  await connectToDatabase();
  const admin = await AdminUserModel.findOne({ email });
  if (!admin || admin.isActive === false) {
    return genericResult;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await AdminPasswordResetTokenModel.create({
    adminId: admin._id,
    tokenHash,
    expiresAt: new Date(Date.now() + ADMIN_PASSWORD_RESET_TOKEN_TTL_MS),
  });

  const resetUrl = `${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.admin.resetPassword}?token=${rawToken}`;
  sendEmail({
    to: admin.email,
    ...passwordResetEmail(admin.name, resetUrl),
  }).catch((error) =>
    logger.error("requestAdminPasswordResetAction", "failed to send reset email", {
      error,
    }),
  );

  return genericResult;
}

export async function resetAdminPasswordAction(
  values: ResetAdminPasswordInput,
): Promise<ActionResult> {
  const parsed = resetAdminPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the form for errors",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ip = await getClientIp();
  const ipLimit = await checkRateLimit(`admin-password-reset-confirm:ip:${ip}`, {
    limit: 10,
    windowMs: 60 * 60_000,
  });
  if (!ipLimit.allowed) {
    return {
      success: false,
      error: "Too many attempts. Please try again later.",
    };
  }

  await connectToDatabase();

  const tokenHash = crypto
    .createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");
  const tokenDoc = await AdminPasswordResetTokenModel.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });
  if (!tokenDoc) {
    return {
      success: false,
      error:
        "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await AdminUserModel.updateOne(
    { _id: tokenDoc.adminId },
    { $set: { passwordHash } },
  );

  // Single-use — delete immediately so the link can't be replayed even
  // within its remaining TTL window.
  await AdminPasswordResetTokenModel.deleteOne({ _id: tokenDoc._id });

  return { success: true, data: undefined };
}

/**
 * Admin "Sign in with Google" — deliberately looks up by googleId ONLY,
 * never by email. Unlike the customer flow's handleGoogleSignIn (which
 * auto-links or auto-creates an account from a Google-verified email
 * alone), an admin's Google identity must already have been attached via
 * linkAdminGoogleAccount below, from an already-authenticated session. If
 * this returns "not_linked", that is by design — there is intentionally no
 * account creation or email-based fallback in this path.
 */
export async function handleAdminGoogleLogin(profile: {
  googleId: string;
}): Promise<ActionResult<{ role: string }>> {
  await connectToDatabase();

  const admin = await AdminUserModel.findOne({ googleId: profile.googleId });
  if (!admin) {
    return { success: false, error: "not_linked" };
  }
  if (admin.isActive === false) {
    return { success: false, error: "account_deactivated" };
  }

  await createSession({
    sub: admin._id.toString(),
    tenantId: admin.tenantId,
    email: admin.email,
    role: admin.role as "owner" | "staff",
    roleSlug: admin.roleSlug ?? undefined,
    kind: "admin",
  });

  return { success: true, data: { role: admin.role } };
}

/**
 * Attaches a Google identity to the CURRENTLY AUTHENTICATED admin's own
 * account — called only from the OAuth callback in "link" mode, which
 * itself only runs after re-verifying a live admin session. Matches by
 * session.sub (the acting admin's own id), never by email, so this can
 * never be used to attach a Google account to someone else's admin record.
 */
export async function linkAdminGoogleAccount(
  googleId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  await connectToDatabase();

  const existing = await AdminUserModel.findOne({ googleId });
  if (existing && existing._id.toString() !== session.sub) {
    return {
      success: false,
      error: "This Google account is already linked to a different admin.",
    };
  }

  await AdminUserModel.updateOne(
    { _id: session.sub },
    { $set: { googleId } },
  );
  return { success: true, data: undefined };
}

export async function unlinkAdminGoogleAccount(): Promise<ActionResult> {
  const session = await requireAdmin();
  await connectToDatabase();
  await AdminUserModel.updateOne(
    { _id: session.sub },
    { $unset: { googleId: "" } },
  );
  return { success: true, data: undefined };
}

export async function getAdminGoogleLinkStatus(): Promise<{ linked: boolean }> {
  const session = await requireAdmin();
  await connectToDatabase();
  const admin = await AdminUserModel.findById(session.sub).select("googleId");
  return { linked: !!admin?.googleId };
}
