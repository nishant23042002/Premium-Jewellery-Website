"use server";

import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongoose";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logger } from "@/lib/logger";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/features/auth/auth.schema";
import { AdminUserModel } from "@/features/auth/admin-user.model";
import type { ActionResult } from "@/types/common";

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

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for") ??
    headerList.get("x-real-ip") ??
    "unknown";
  const email = parsed.data.email.toLowerCase();

  // Lock out by email AND by IP so an attacker can't work around either
  // limit alone (spraying many emails from one IP, or one email from many
  // IPs/proxies). 5 attempts / 15 min, matching the login form's own retry
  // expectations for a genuine mistyped password.
  const emailLimit = checkRateLimit(`login:email:${email}`, {
    limit: 5,
    windowMs: 15 * 60_000,
  });
  const ipLimit = checkRateLimit(`login:ip:${ip}`, {
    limit: 20,
    windowMs: 15 * 60_000,
  });
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
  });

  return { success: true, data: { role: admin.role } };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}
