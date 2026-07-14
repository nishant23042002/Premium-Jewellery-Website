"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { uploadImageBuffer, deleteImage } from "@/lib/cloudinary/upload";
import { MediaAssetModel } from "@/features/media/media.model";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult, PaginatedResult } from "@/types/common";
import type { MediaAsset } from "@/features/media/media.types";

interface MediaAssetDoc {
  _id: unknown;
  tenantId: string;
  url: string;
  publicId: string;
  width: number;
  height: number;
  fileName?: string | null;
  uploadedByAdminId: string;
  tags: string[];
  createdAt: Date;
}

function toMediaAsset(doc: MediaAssetDoc): MediaAsset {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    url: doc.url,
    publicId: doc.publicId,
    width: doc.width,
    height: doc.height,
    fileName: doc.fileName ?? undefined,
    uploadedByAdminId: doc.uploadedByAdminId,
    tags: doc.tags,
    createdAt: doc.createdAt.toISOString(),
  };
}

export interface ListMediaAssetsParams {
  page?: number;
  pageSize?: number;
}

export async function listMediaAssets({
  page = 1,
  pageSize = 40,
}: ListMediaAssetsParams = {}): Promise<PaginatedResult<MediaAsset>> {
  await requireAdmin();
  await connectToDatabase();

  const filter = { tenantId: DEFAULT_TENANT_ID };
  const [docs, total] = await Promise.all([
    MediaAssetModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    MediaAssetModel.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => toMediaAsset(doc as unknown as MediaAssetDoc)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Accepts a browser FormData with a single "file" entry — the Media Uploader's submit handler. */
export async function uploadMediaAsset(
  formData: FormData,
): Promise<ActionResult<MediaAsset>> {
  const session = await requirePermission("media.manage");

  // `instanceof File` fails here: this action is invoked directly (not via
  // a <form> submission), and Next's Server Action wire protocol reconstructs
  // the uploaded entry as a `Blob` rather than a full `File` in that path.
  // `Blob` still has everything `uploadImageBuffer` needs (`arrayBuffer()`,
  // `type`, `size`) — only the filename is File-specific, so that's read
  // separately below with a graceful fallback instead of gating on it.
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return { success: false, error: "No file provided" };
  }
  const fileName = file instanceof File ? file.name : undefined;

  await connectToDatabase();

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImageBuffer(buffer, {
      folder: "Ambika-Jewellers",
      mimeType: file.type,
    });

    const doc = await MediaAssetModel.create({
      tenantId: DEFAULT_TENANT_ID,
      url: uploaded.url,
      publicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
      fileName,
      uploadedByAdminId: session.sub,
      tags: [],
    });

    logAudit(session, "uploaded", "media", String(doc._id), fileName);
    revalidatePath(ROUTES.admin.media);
    return { success: true, data: toMediaAsset(doc.toObject()) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/** Sets an asset's tags — the field already exists on the model but nothing wrote to it until now. */
export async function updateMediaAssetTags(
  id: string,
  tags: string[],
): Promise<ActionResult<MediaAsset>> {
  const session = await requirePermission("media.manage");
  await connectToDatabase();

  const doc = await MediaAssetModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { $set: { tags } },
    { new: true },
  );
  if (!doc) {
    return { success: false, error: "Asset not found" };
  }

  logAudit(session, "updated", "media", id, doc.fileName ?? doc.publicId);
  revalidatePath(ROUTES.admin.media);
  return { success: true, data: toMediaAsset(doc.toObject()) };
}

export async function deleteMediaAsset(id: string): Promise<ActionResult> {
  const session = await requirePermission("media.manage");
  await connectToDatabase();

  const doc = await MediaAssetModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  });
  if (!doc) {
    return { success: false, error: "Asset not found" };
  }

  await deleteImage(doc.publicId).catch((error) =>
    logger.error("deleteMediaAsset", "Cloudinary delete failed", { error }),
  );
  await MediaAssetModel.deleteOne({ _id: id, tenantId: DEFAULT_TENANT_ID });

  logAudit(session, "deleted", "media", id, doc.fileName ?? doc.publicId);
  revalidatePath(ROUTES.admin.media);
  return { success: true, data: undefined };
}
