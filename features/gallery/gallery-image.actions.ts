"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { GalleryImageModel } from "@/features/gallery/gallery-image.model";
import {
  galleryImageFormSchema,
  type GalleryImageFormInput,
} from "@/features/gallery/gallery-image.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { GalleryImage } from "@/features/gallery/gallery-image.types";

interface GalleryImageDoc {
  _id: unknown;
  tenantId: string;
  imageUrl: string;
  caption?: GalleryImage["caption"] | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toGalleryImage(doc: GalleryImageDoc): GalleryImage {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    imageUrl: doc.imageUrl,
    caption: doc.caption ?? undefined,
    sortOrder: doc.sortOrder,
    isPublished: doc.isPublished,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listGalleryImages({
  publishedOnly = true,
}: { publishedOnly?: boolean } = {}): Promise<GalleryImage[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (publishedOnly) filter.isPublished = true;

  const docs = await GalleryImageModel.find(filter)
    .sort({ sortOrder: 1 })
    .lean();
  return docs.map((doc) => toGalleryImage(doc as unknown as GalleryImageDoc));
}

export async function getGalleryImageByIdForAdmin(
  id: string,
): Promise<GalleryImage | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await GalleryImageModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toGalleryImage(doc as unknown as GalleryImageDoc) : null;
}

export async function createGalleryImage(
  values: GalleryImageFormInput,
): Promise<ActionResult<GalleryImage>> {
  const session = await requirePermission("gallery.manage");

  const parsed = galleryImageFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid gallery image data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await GalleryImageModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "gallery_image", String(doc._id));
  revalidatePath(ROUTES.admin.gallery);
  return {
    success: true,
    data: toGalleryImage(doc.toObject() as unknown as GalleryImageDoc),
  };
}

export async function updateGalleryImage(
  id: string,
  values: GalleryImageFormInput,
): Promise<ActionResult<GalleryImage>> {
  const session = await requirePermission("gallery.manage");

  const parsed = galleryImageFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid gallery image data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await GalleryImageModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Gallery image not found" };
  }

  logAudit(session, "updated", "gallery_image", String(doc._id));
  revalidatePath(ROUTES.admin.gallery);
  return {
    success: true,
    data: toGalleryImage(doc.toObject() as unknown as GalleryImageDoc),
  };
}

/** Soft delete — moves the image to the Recycle Bin instead of destroying it outright. */
export async function deleteGalleryImage(id: string): Promise<ActionResult> {
  const session = await requirePermission("gallery.manage");
  await connectToDatabase();

  const doc = await GalleryImageModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Gallery image not found" };
  }

  logAudit(session, "deleted", "gallery_image", id);
  revalidatePath(ROUTES.admin.gallery);
  return { success: true, data: undefined };
}
