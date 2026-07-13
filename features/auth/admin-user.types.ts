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

/** Decoded JWT payload carried in the admin session cookie. */
export interface SessionPayload {
  sub: string; // AdminUser id
  tenantId: string;
  email: string;
  role: AdminRole;
  roleSlug?: string;
}
