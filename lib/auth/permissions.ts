import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RoleModel } from "@/features/roles/role.model";
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_STAFF_PERMISSIONS,
} from "@/constants/permissions";
import type { SessionPayload } from "@/features/auth/admin-user.types";

/**
 * Resolves the effective permission set for a session. Owners are always a
 * superuser (never gated by a stored role, so ownership can't accidentally
 * lock itself out). Staff resolve against their assigned Role document,
 * falling back to the seeded "Staff" defaults if unassigned or the role was
 * since deleted.
 */
export async function getSessionPermissions(
  session: SessionPayload,
): Promise<string[]> {
  if (session.role === "owner") return ALL_PERMISSION_KEYS;

  await connectToDatabase();
  const role = session.roleSlug
    ? await RoleModel.findOne({
        tenantId: session.tenantId,
        slug: session.roleSlug,
      }).lean()
    : null;

  return role?.permissions ?? DEFAULT_STAFF_PERMISSIONS;
}

/**
 * Throws-free-for-callers guard for Server Actions that need a specific
 * permission, not just "is logged in" (PRD §35 — enforced server-side,
 * never UI-only). Note: since sessions are stateless JWTs, a permission
 * change takes effect on next login for owners (who bypass this check
 * anyway) but immediately for staff, since this always re-reads the Role
 * from the database rather than trusting anything cached in the token.
 */
export async function requirePermission(
  permission: string,
): Promise<SessionPayload> {
  const session = await requireAdmin();
  if (session.role === "owner") return session;

  const permissions = await getSessionPermissions(session);
  if (!permissions.includes(permission)) {
    throw new Error("Insufficient permissions");
  }
  return session;
}
