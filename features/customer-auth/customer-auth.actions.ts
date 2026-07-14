"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongoose";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createCustomerSession,
  destroyCustomerSession,
  getCustomerSession,
  requireCustomer,
} from "@/lib/auth/customer-session";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logger } from "@/lib/logger";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { clientEnv } from "@/config/env";
import { sendEmail } from "@/lib/notifications/send-email";
import { passwordResetEmail } from "@/lib/notifications/email-templates";
import { CustomerAccountModel } from "@/features/customer-auth/customer-account.model";
import { PasswordResetTokenModel } from "@/features/customer-auth/password-reset-token.model";
import {
  addressFormSchema,
  customerLoginFormSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  signupFormSchema,
  type AddressFormInput,
  type CustomerLoginFormValues,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
  type SignupFormValues,
} from "@/features/customer-auth/customer-account.schema";
import { ROUTES } from "@/constants/routes";
import type {
  Address,
  CustomerAccount,
} from "@/features/customer-auth/customer-account.types";
import type { ActionResult } from "@/types/common";

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60_000;

interface AddressDoc {
  _id: unknown;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface CustomerAccountDoc {
  _id: unknown;
  tenantId: string;
  email: string;
  name: string;
  phone?: string | null;
  addresses: AddressDoc[];
  isActive: boolean;
  createdAt: Date;
  authProvider?: "password" | "google" | null;
}

function toAddress(doc: AddressDoc): Address {
  return {
    id: String(doc._id),
    label: doc.label,
    line1: doc.line1,
    line2: doc.line2 ?? undefined,
    city: doc.city,
    state: doc.state,
    pincode: doc.pincode,
    isDefault: doc.isDefault,
  };
}

function toCustomerAccount(doc: CustomerAccountDoc): CustomerAccount {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    email: doc.email,
    name: doc.name,
    phone: doc.phone ?? undefined,
    addresses: (doc.addresses ?? []).map(toAddress),
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    authProvider: doc.authProvider ?? "password",
  };
}

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for") ??
    headerList.get("x-real-ip") ??
    "unknown"
  );
}

export async function signupAction(
  values: SignupFormValues,
): Promise<ActionResult<{ customerId: string }>> {
  const parsed = signupFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid signup details",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ip = await getClientIp();
  const ipLimit = await checkRateLimit(`customer-signup:ip:${ip}`, {
    limit: 10,
    windowMs: 60 * 60_000,
  });
  if (!ipLimit.allowed) {
    return {
      success: false,
      error: "Too many signup attempts. Please try again later.",
    };
  }

  await connectToDatabase();

  const email = parsed.data.email.toLowerCase();
  const existing = await CustomerAccountModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    email,
  }).select("+passwordHash");
  if (existing) {
    return {
      success: false,
      error:
        existing.authProvider === "google" && !existing.passwordHash
          ? "This email is linked with Google. Please continue with Google to sign in."
          : "An account with this email already exists",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const doc = await CustomerAccountModel.create({
    tenantId: DEFAULT_TENANT_ID,
    email,
    passwordHash,
    name: parsed.data.name,
    phone: parsed.data.phone,
  });

  await createCustomerSession({
    sub: String(doc._id),
    tenantId: DEFAULT_TENANT_ID,
    email,
    kind: "customer",
  });

  return { success: true, data: { customerId: String(doc._id) } };
}

export async function customerLoginAction(
  values: CustomerLoginFormValues,
): Promise<ActionResult> {
  const parsed = customerLoginFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid credentials",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const ip = await getClientIp();

  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit(`customer-login:email:${email}`, {
      limit: 5,
      windowMs: 15 * 60_000,
    }),
    checkRateLimit(`customer-login:ip:${ip}`, { limit: 20, windowMs: 15 * 60_000 }),
  ]);
  if (!emailLimit.allowed || !ipLimit.allowed) {
    logger.warn("customerLoginAction", "rate limited", { email, ip });
    return {
      success: false,
      error: "Too many login attempts. Please try again in a few minutes.",
    };
  }

  await connectToDatabase();

  const customer = await CustomerAccountModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    email,
  }).select("+passwordHash");

  // Same generic error whether the email doesn't exist or the password is
  // wrong — avoids leaking which emails have accounts.
  if (!customer) {
    return { success: false, error: "Invalid email or password" };
  }

  if (!customer.passwordHash) {
    return {
      success: false,
      error: "This account uses Google Sign-In. Please continue with Google below.",
    };
  }

  const isValid = await verifyPassword(
    parsed.data.password,
    customer.passwordHash,
  );
  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }

  if (customer.isActive === false) {
    return { success: false, error: "This account has been deactivated" };
  }

  await createCustomerSession({
    sub: String(customer._id),
    tenantId: customer.tenantId,
    email: customer.email,
    kind: "customer",
  });

  return { success: true, data: undefined };
}

export async function customerLogoutAction(): Promise<void> {
  await destroyCustomerSession();
}

interface GoogleProfileInput {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

/**
 * Called from app/api/auth/google/callback/route.ts once Google's profile
 * has been fetched server-side (a direct HTTPS call to Google's own
 * userinfo endpoint, so the data is already trustworthy — no separate
 * signature verification needed). Finds an existing Google-linked account;
 * otherwise auto-links a matching password account, but only when Google
 * confirms the email is verified (an unverified email can't be trusted
 * enough to attach to someone else's existing account); otherwise creates a
 * new Google-only account (no passwordHash until they set one via the
 * reset-password flow).
 */
export async function handleGoogleSignIn(
  profile: GoogleProfileInput,
): Promise<ActionResult<{ customerId: string }>> {
  await connectToDatabase();
  const email = profile.email.toLowerCase();

  let customer = await CustomerAccountModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    googleId: profile.googleId,
  });

  if (!customer) {
    const existingByEmail = await CustomerAccountModel.findOne({
      tenantId: DEFAULT_TENANT_ID,
      email,
    });

    if (existingByEmail) {
      if (!profile.emailVerified) {
        return { success: false, error: "email_not_verified" };
      }
      existingByEmail.googleId = profile.googleId;
      await existingByEmail.save();
      customer = existingByEmail;
    } else {
      if (!profile.emailVerified) {
        return { success: false, error: "email_not_verified" };
      }
      customer = await CustomerAccountModel.create({
        tenantId: DEFAULT_TENANT_ID,
        email,
        name: profile.name,
        googleId: profile.googleId,
        authProvider: "google",
      });
    }
  }

  if (customer.isActive === false) {
    return { success: false, error: "account_deactivated" };
  }

  await createCustomerSession({
    sub: String(customer._id),
    tenantId: customer.tenantId,
    email: customer.email,
    kind: "customer",
  });

  return { success: true, data: { customerId: String(customer._id) } };
}

/**
 * Always returns success regardless of whether the email is registered,
 * rate-limited, or belongs to a deactivated account — the whole point is
 * that a stranger probing this form can't learn which emails have accounts
 * here. The real work (does a matching active customer exist? send the
 * email?) happens silently behind that constant response.
 */
export async function requestPasswordResetAction(
  values: RequestPasswordResetInput,
): Promise<ActionResult> {
  const genericResult: ActionResult = { success: true, data: undefined };

  const parsed = requestPasswordResetSchema.safeParse(values);
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
    checkRateLimit(`password-reset:ip:${ip}`, { limit: 10, windowMs: 60 * 60_000 }),
    checkRateLimit(`password-reset:email:${email}`, { limit: 3, windowMs: 60 * 60_000 }),
  ]);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    logger.warn("requestPasswordResetAction", "rate limited", { email, ip });
    return genericResult;
  }

  await connectToDatabase();
  const customer = await CustomerAccountModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    email,
  });
  if (!customer || customer.isActive === false) {
    return genericResult;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await PasswordResetTokenModel.create({
    customerId: customer._id,
    tokenHash,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
  });

  const resetUrl = `${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.accountResetPassword}?token=${rawToken}`;
  sendEmail({
    to: customer.email,
    ...passwordResetEmail(customer.name, resetUrl),
  }).catch((error) =>
    logger.error("requestPasswordResetAction", "failed to send reset email", {
      error,
    }),
  );

  return genericResult;
}

export async function resetPasswordAction(
  values: ResetPasswordInput,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the form for errors",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ip = await getClientIp();
  const ipLimit = await checkRateLimit(`password-reset-confirm:ip:${ip}`, {
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
  const tokenDoc = await PasswordResetTokenModel.findOne({
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
  await CustomerAccountModel.updateOne(
    { _id: tokenDoc.customerId },
    { $set: { passwordHash } },
  );

  // Single-use — delete immediately so the link can't be replayed even
  // within its remaining TTL window.
  await PasswordResetTokenModel.deleteOne({ _id: tokenDoc._id });

  return { success: true, data: undefined };
}

/** Returns `null` if not logged in — callers decide whether that means "show a login prompt" or "redirect". */
export async function getCurrentCustomer(): Promise<CustomerAccount | null> {
  const session = await getCustomerSession();
  if (!session) return null;

  await connectToDatabase();
  const doc = await CustomerAccountModel.findById(session.sub).lean();
  return doc ? toCustomerAccount(doc as unknown as CustomerAccountDoc) : null;
}

export async function addAddress(
  values: AddressFormInput,
): Promise<ActionResult<Address>> {
  const session = await requireCustomer();
  const parsed = addressFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid address",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  // A new default address demotes any existing one — only one address can
  // be the default shipping/billing choice at checkout.
  if (parsed.data.isDefault) {
    await CustomerAccountModel.updateOne(
      { _id: session.sub },
      { $set: { "addresses.$[].isDefault": false } },
    );
  }

  const customer = await CustomerAccountModel.findByIdAndUpdate(
    session.sub,
    { $push: { addresses: parsed.data } },
    { returnDocument: "after" },
  );
  if (!customer) {
    return { success: false, error: "Account not found" };
  }

  const added = customer.addresses[customer.addresses.length - 1];
  return { success: true, data: toAddress(added as unknown as AddressDoc) };
}

export async function removeAddress(addressId: string): Promise<ActionResult> {
  const session = await requireCustomer();
  await connectToDatabase();

  await CustomerAccountModel.updateOne(
    { _id: session.sub },
    { $pull: { addresses: { _id: addressId } } },
  );

  return { success: true, data: undefined };
}
