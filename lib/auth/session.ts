import "server-only";
import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AdminUserModel } from "@/features/auth/admin-user.model";
import type { SessionPayload } from "@/features/auth/admin-user.types";

export const SESSION_COOKIE_NAME = "ambika_admin_session";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches JWT_EXPIRES_IN default

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = signSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifySessionToken<SessionPayload>(token);
  // Runtime check, not just a type — admin and customer tokens share a
  // signing secret, so this is what actually stops a customer session
  // token from being replayed here (or vice versa in
  // customer-session.ts), not just TypeScript's static typing.
  if (!session || session.kind !== "admin") return null;
  return session;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Throws-free guard for use inside Server Actions/Route Handlers. Re-checks
 * `isActive` against the DB on every call (rather than trusting the JWT)
 * so a staff account deactivated mid-session loses access immediately
 * instead of retaining a valid cookie until natural token expiry.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }

  await connectToDatabase();
  const admin = await AdminUserModel.findById(session.sub)
    .select("isActive")
    .lean();
  if (!admin || admin.isActive === false) {
    throw new Error("This account has been deactivated");
  }

  return session;
}

/** Role check on top of authentication — enforced server-side (PRD §35), never UI-only. */
export async function requireRole(
  role: SessionPayload["role"],
): Promise<SessionPayload> {
  const session = await requireAdmin();
  if (session.role !== role && session.role !== "owner") {
    throw new Error("Insufficient permissions");
  }
  return session;
}
