"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requirePermission } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { AdminUserModel } from "@/features/auth/admin-user.model";
import {
  adminUserFormSchema,
  type AdminUserFormInput,
} from "@/features/auth/admin-user.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { AdminUser } from "@/features/auth/admin-user.types";

interface AdminUserDoc {
  _id: unknown;
  tenantId: string;
  email: string;
  name: string;
  role: AdminUser["role"];
  roleSlug?: string | null;
  isActive?: boolean;
  createdAt: Date;
}

function toAdminUser(doc: AdminUserDoc): AdminUser {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    email: doc.email,
    name: doc.name,
    role: doc.role,
    roleSlug: doc.roleSlug ?? undefined,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  await requirePermission("staff.manage");
  await connectToDatabase();
  const docs = await AdminUserModel.find({ tenantId: DEFAULT_TENANT_ID })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => toAdminUser(doc as unknown as AdminUserDoc));
}

export async function getAdminUserByIdForAdmin(
  id: string,
): Promise<AdminUser | null> {
  await requirePermission("staff.manage");
  await connectToDatabase();
  const doc = await AdminUserModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toAdminUser(doc as unknown as AdminUserDoc) : null;
}

export async function createAdminUser(
  values: AdminUserFormInput,
): Promise<ActionResult<AdminUser>> {
  const session = await requirePermission("staff.manage");

  const parsed = adminUserFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid staff data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  if (!parsed.data.password) {
    return { success: false, error: "Password is required for a new account" };
  }

  await connectToDatabase();

  const email = parsed.data.email.toLowerCase();
  const existing = await AdminUserModel.findOne({
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

  const doc = await AdminUserModel.create({
    tenantId: DEFAULT_TENANT_ID,
    email,
    name: parsed.data.name,
    passwordHash,
    role: parsed.data.role,
    roleSlug: parsed.data.roleSlug || undefined,
    isActive: parsed.data.isActive,
  });

  logAudit(session, "created", "staff", String(doc._id), doc.name);
  revalidatePath(ROUTES.admin.staff);
  return {
    success: true,
    data: toAdminUser(doc.toObject() as unknown as AdminUserDoc),
  };
}

export async function updateAdminUser(
  id: string,
  values: AdminUserFormInput,
): Promise<ActionResult<AdminUser>> {
  const session = await requirePermission("staff.manage");

  const parsed = adminUserFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid staff data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (session.sub === id && parsed.data.isActive === false) {
    return { success: false, error: "You can't deactivate your own account" };
  }

  await connectToDatabase();

  const update: Record<string, unknown> = {
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    roleSlug: parsed.data.roleSlug || undefined,
    isActive: parsed.data.isActive,
  };
  if (parsed.data.password) {
    update.passwordHash = await hashPassword(parsed.data.password);
  }

  const doc = await AdminUserModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    update,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Staff account not found" };
  }

  logAudit(session, "updated", "staff", String(doc._id), doc.name);
  revalidatePath(ROUTES.admin.staff);
  return {
    success: true,
    data: toAdminUser(doc.toObject() as unknown as AdminUserDoc),
  };
}
