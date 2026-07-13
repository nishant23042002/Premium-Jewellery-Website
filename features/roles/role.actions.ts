"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { RoleModel } from "@/features/roles/role.model";
import {
  roleFormSchema,
  type RoleFormInput,
} from "@/features/roles/role.schema";
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_STAFF_PERMISSIONS,
} from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import type { ActionResult } from "@/types/common";
import type { Role } from "@/features/roles/role.types";

interface RoleDoc {
  _id: unknown;
  tenantId: string;
  name: string;
  slug: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toRole(doc: RoleDoc): Role {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    name: doc.name,
    slug: doc.slug,
    permissions: doc.permissions,
    isSystem: doc.isSystem,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Guarantees the two built-in roles exist — called lazily wherever roles are read, no separate migration step needed. */
export async function ensureSystemRoles(): Promise<void> {
  await connectToDatabase();
  await RoleModel.findOneAndUpdate(
    { tenantId: DEFAULT_TENANT_ID, slug: "owner" },
    {
      $setOnInsert: {
        tenantId: DEFAULT_TENANT_ID,
        name: "Owner",
        slug: "owner",
        permissions: ALL_PERMISSION_KEYS,
        isSystem: true,
      },
    },
    { upsert: true },
  );
  await RoleModel.findOneAndUpdate(
    { tenantId: DEFAULT_TENANT_ID, slug: "staff" },
    {
      $setOnInsert: {
        tenantId: DEFAULT_TENANT_ID,
        name: "Staff",
        slug: "staff",
        permissions: DEFAULT_STAFF_PERMISSIONS,
        isSystem: true,
      },
    },
    { upsert: true },
  );
}

export async function listRoles(): Promise<Role[]> {
  await requireAdmin();
  await ensureSystemRoles();

  const docs = await RoleModel.find({ tenantId: DEFAULT_TENANT_ID })
    .sort({ isSystem: -1, name: 1 })
    .lean();
  return docs.map((doc) => toRole(doc as unknown as RoleDoc));
}

export async function getRoleById(id: string): Promise<Role | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await RoleModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toRole(doc as unknown as RoleDoc) : null;
}

export async function createRole(
  values: RoleFormInput,
): Promise<ActionResult<Role>> {
  const session = await requirePermission("roles.manage");

  const parsed = roleFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid role data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await RoleModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug: parsed.data.slug,
  });
  if (existing) {
    return { success: false, error: "A role with this slug already exists" };
  }

  const doc = await RoleModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
    isSystem: false,
  });

  logAudit(session, "created", "role", String(doc._id), doc.name);
  revalidatePath(ROUTES.admin.roles);
  return { success: true, data: toRole(doc.toObject()) };
}

export async function updateRole(
  id: string,
  values: RoleFormInput,
): Promise<ActionResult<Role>> {
  const session = await requirePermission("roles.manage");

  const parsed = roleFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid role data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await RoleModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  });
  if (!existing) {
    return { success: false, error: "Role not found" };
  }

  // System roles keep their slug/identity, but permissions (and the
  // Staff role's display name) can still be tuned by the owner.
  const update = existing.isSystem
    ? { name: parsed.data.name, permissions: parsed.data.permissions }
    : parsed.data;

  const doc = await RoleModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    update,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Role not found" };
  }

  logAudit(session, "updated", "role", String(doc._id), doc.name);
  revalidatePath(ROUTES.admin.roles);
  return { success: true, data: toRole(doc.toObject()) };
}

export async function deleteRole(id: string): Promise<ActionResult> {
  const session = await requirePermission("roles.manage");
  await connectToDatabase();

  const existing = await RoleModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  });
  if (!existing) {
    return { success: false, error: "Role not found" };
  }
  if (existing.isSystem) {
    return { success: false, error: "System roles can't be deleted" };
  }

  await RoleModel.deleteOne({ _id: id, tenantId: DEFAULT_TENANT_ID });

  logAudit(session, "deleted", "role", id, existing.name);
  revalidatePath(ROUTES.admin.roles);
  return { success: true, data: undefined };
}
