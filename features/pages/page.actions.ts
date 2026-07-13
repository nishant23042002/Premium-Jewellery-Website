"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { CmsPageModel } from "@/features/pages/page.model";
import {
  cmsPageFormSchema,
  type CmsPageFormInput,
} from "@/features/pages/page.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { CmsPage } from "@/features/pages/page.types";

interface CmsPageDoc {
  _id: unknown;
  tenantId: string;
  slug: string;
  title: CmsPage["title"];
  content: CmsPage["content"];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toCmsPage(doc: CmsPageDoc): CmsPage {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    slug: doc.slug,
    title: doc.title,
    content: doc.content,
    isPublished: doc.isPublished,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listCmsPagesForAdmin(): Promise<CmsPage[]> {
  await requireAdmin();
  await connectToDatabase();
  const docs = await CmsPageModel.find({
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => toCmsPage(doc as unknown as CmsPageDoc));
}

/** Public — every published page, for the storefront footer nav. No auth (unlike listCmsPagesForAdmin). */
export async function listPublishedCmsPages(): Promise<CmsPage[]> {
  await connectToDatabase();
  const docs = await CmsPageModel.find({
    tenantId: DEFAULT_TENANT_ID,
    isPublished: true,
    ...NOT_DELETED_FILTER,
  })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => toCmsPage(doc as unknown as CmsPageDoc));
}

export async function getCmsPageBySlug(slug: string): Promise<CmsPage | null> {
  await connectToDatabase();
  const doc = await CmsPageModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug,
    isPublished: true,
    ...NOT_DELETED_FILTER,
  }).lean();
  return doc ? toCmsPage(doc as unknown as CmsPageDoc) : null;
}

export async function getCmsPageByIdForAdmin(
  id: string,
): Promise<CmsPage | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await CmsPageModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toCmsPage(doc as unknown as CmsPageDoc) : null;
}

export async function createCmsPage(
  values: CmsPageFormInput,
): Promise<ActionResult<CmsPage>> {
  const session = await requirePermission("pages.manage");

  const parsed = cmsPageFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid page data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await CmsPageModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug: parsed.data.slug,
  });
  if (existing) {
    return { success: false, error: "A page with this slug already exists" };
  }

  const doc = await CmsPageModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "cms_page", String(doc._id), doc.title.en);
  revalidatePath(ROUTES.admin.pages);
  return {
    success: true,
    data: toCmsPage(doc.toObject() as unknown as CmsPageDoc),
  };
}

export async function updateCmsPage(
  id: string,
  values: CmsPageFormInput,
): Promise<ActionResult<CmsPage>> {
  const session = await requirePermission("pages.manage");

  const parsed = cmsPageFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid page data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await CmsPageModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Page not found" };
  }

  logAudit(session, "updated", "cms_page", String(doc._id), doc.title.en);
  revalidatePath(ROUTES.admin.pages);
  revalidatePath(`/pages/${doc.slug}`);
  return {
    success: true,
    data: toCmsPage(doc.toObject() as unknown as CmsPageDoc),
  };
}

/** Soft delete — moves the page to the Recycle Bin instead of destroying it outright. */
export async function deleteCmsPage(id: string): Promise<ActionResult> {
  const session = await requirePermission("pages.manage");
  await connectToDatabase();

  const doc = await CmsPageModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Page not found" };
  }

  logAudit(session, "deleted", "cms_page", id, doc.title.en);
  revalidatePath(ROUTES.admin.pages);
  return { success: true, data: undefined };
}
