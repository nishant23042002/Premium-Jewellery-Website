import "server-only";
import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CustomerAccountModel } from "@/features/customer-auth/customer-account.model";
import type { CustomerSessionPayload } from "@/features/customer-auth/customer-account.types";

/** Deliberately a different cookie name from the admin session (`ambika_admin_session`) — the two auth systems never share a token. */
export const CUSTOMER_SESSION_COOKIE_NAME = "ambika_customer_session";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days — shoppers expect to stay signed in much longer than staff

export async function createCustomerSession(
  payload: CustomerSessionPayload,
): Promise<void> {
  const token = signSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(CUSTOMER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifySessionToken<CustomerSessionPayload>(token);
  // Runtime check, not just a type — admin and customer tokens share a
  // signing secret, so this is what actually stops an admin session token
  // from being replayed here (see lib/auth/session.ts for the mirror check).
  if (!session || session.kind !== "customer") return null;
  return session;
}

export async function destroyCustomerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE_NAME);
}

/** Throws-free guard for Server Actions/Route Handlers — re-checks `isActive` against the DB on every call, same reasoning as `requireAdmin()`. */
export async function requireCustomer(): Promise<CustomerSessionPayload> {
  const session = await getCustomerSession();
  if (!session) {
    throw new Error("Not authenticated");
  }

  await connectToDatabase();
  const customer = await CustomerAccountModel.findById(session.sub)
    .select("isActive")
    .lean();
  if (!customer || customer.isActive === false) {
    throw new Error("This account has been deactivated");
  }

  return session;
}
