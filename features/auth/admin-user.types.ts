export type AdminRole = "owner" | "staff";

export interface AdminUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: AdminRole;
  /** Custom Role slug for staff accounts — unset means "use the seeded Staff defaults". Ignored for owners (always superuser). */
  roleSlug?: string;
  isActive: boolean;
  createdAt: string;
}

/** Decoded JWT payload carried in the admin session cookie — deliberately carries `kind: "admin"` (mirroring `CustomerSessionPayload`'s `kind: "customer"`) so admin and customer tokens, which share the same signing secret, can never be swapped for each other even if an ObjectId happened to collide across the two collections. `getSession()` enforces this at runtime, not just in the type. */
export interface SessionPayload {
  sub: string; // AdminUser id
  tenantId: string;
  email: string;
  role: AdminRole;
  roleSlug?: string;
  kind: "admin";
}
