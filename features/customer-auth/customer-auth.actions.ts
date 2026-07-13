"use server";

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
import { CustomerAccountModel } from "@/features/customer-auth/customer-account.model";
import {
  addressFormSchema,
  customerLoginFormSchema,
  signupFormSchema,
  type AddressFormInput,
  type CustomerLoginFormValues,
  type SignupFormValues,
} from "@/features/customer-auth/customer-account.schema";
import type {
  Address,
  CustomerAccount,
} from "@/features/customer-auth/customer-account.types";
import type { ActionResult } from "@/types/common";

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
  const ipLimit = checkRateLimit(`customer-signup:ip:${ip}`, {
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
  });
  if (existing) {
    return {
      success: false,
      error: "An account with this email already exists",
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

  const emailLimit = checkRateLimit(`customer-login:email:${email}`, {
    limit: 5,
    windowMs: 15 * 60_000,
  });
  const ipLimit = checkRateLimit(`customer-login:ip:${ip}`, {
    limit: 20,
    windowMs: 15 * 60_000,
  });
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
