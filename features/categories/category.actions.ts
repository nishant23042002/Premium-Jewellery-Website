"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { CategoryModel } from "@/features/categories/category.model";
import {
  categoryFormSchema,
  type CategoryFormInput,
} from "@/features/categories/category.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { Category } from "@/features/categories/category.types";

function toCategory(doc: {
  _id: unknown;
  tenantId: string;
  slug: string;
  name: Category["name"];
  imageUrl?: string | null;
  sortOrder: number;
  parentId?: unknown;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Category {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    slug: doc.slug,
    name: doc.name,
    imageUrl: doc.imageUrl ?? undefined,
    sortOrder: doc.sortOrder,
    parentId: doc.parentId ? String(doc.parentId) : null,
    isPublished: doc.isPublished,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listCategories({
  publishedOnly = true,
}: { publishedOnly?: boolean } = {}): Promise<Category[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (publishedOnly) filter.isPublished = true;

  const docs = await CategoryModel.find(filter).sort({ sortOrder: 1 }).lean();
  return docs.map(toCategory);
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  await connectToDatabase();
  const doc = await CategoryModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug,
    isPublished: true,
    ...NOT_DELETED_FILTER,
  }).lean();

  return doc ? toCategory(doc) : null;
}

export async function getCategoryByIdForAdmin(
  id: string,
): Promise<Category | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await CategoryModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toCategory(doc) : null;
}

export async function createCategory(
  values: CategoryFormInput,
): Promise<ActionResult<Category>> {
  const session = await requirePermission("categories.manage");

  const parsed = categoryFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid category data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await CategoryModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug: parsed.data.slug,
  });
  if (existing) {
    return {
      success: false,
      error: "A category with this slug already exists",
    };
  }

  const doc = await CategoryModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "category", String(doc._id), doc.name.en);
  revalidatePath(ROUTES.admin.categories);
  return { success: true, data: toCategory(doc.toObject()) };
}

export async function updateCategory(
  id: string,
  values: CategoryFormInput,
): Promise<ActionResult<Category>> {
  const session = await requirePermission("categories.manage");

  const parsed = categoryFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid category data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await CategoryModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Category not found" };
  }

  logAudit(session, "updated", "category", String(doc._id), doc.name.en);
  revalidatePath(ROUTES.admin.categories);
  return { success: true, data: toCategory(doc.toObject()) };
}

/** Soft delete — moves the category to the Recycle Bin instead of destroying it outright. */
export async function deleteCategory(id: string): Promise<ActionResult> {
  const session = await requirePermission("categories.manage");
  await connectToDatabase();

  const doc = await CategoryModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Category not found" };
  }

  logAudit(session, "deleted", "category", id, doc.name.en);
  revalidatePath(ROUTES.admin.categories);
  return { success: true, data: undefined };
}
