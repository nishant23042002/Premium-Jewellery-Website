/** A named set of permissions a staff account can be assigned (Phase 7 "Roles & Permissions"). */
export interface Role {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  permissions: string[];
  /** "owner" and "staff" are seeded automatically and can't be deleted or renamed. */
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}
