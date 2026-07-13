"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { CollectionModel } from "@/features/collections/collection.model";
import {
  collectionFormSchema,
  type CollectionFormInput,
} from "@/features/collections/collection.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { Collection } from "@/features/collections/collection.types";

interface CollectionDoc {
  _id: unknown;
  tenantId: string;
  slug: string;
  name: Collection["name"];
  description?: Collection["description"] | null;
  imageUrl?: string | null;
  productIds: unknown[];
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

function toCollection(doc: CollectionDoc): Collection {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    slug: doc.slug,
    name: doc.name,
    description: doc.description ?? undefined,
    imageUrl: doc.imageUrl ?? undefined,
    productIds: doc.productIds.map((id) => String(id)),
    isFeatured: doc.isFeatured,
    isPublished: doc.isPublished,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listCollections({
  publishedOnly = true,
}: { publishedOnly?: boolean } = {}): Promise<Collection[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (publishedOnly) filter.isPublished = true;

  const docs = await CollectionModel.find(filter).sort({ sortOrder: 1 }).lean();
  return docs.map((doc) => toCollection(doc as unknown as CollectionDoc));
}

export async function getCollectionBySlug(
  slug: string,
): Promise<Collection | null> {
  await connectToDatabase();
  const doc = await CollectionModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug,
    isPublished: true,
    ...NOT_DELETED_FILTER,
  }).lean();
  return doc ? toCollection(doc as unknown as CollectionDoc) : null;
}

export async function getCollectionByIdForAdmin(
  id: string,
): Promise<Collection | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await CollectionModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toCollection(doc as unknown as CollectionDoc) : null;
}

export async function createCollection(
  values: CollectionFormInput,
): Promise<ActionResult<Collection>> {
  const session = await requirePermission("collections.manage");

  const parsed = collectionFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid collection data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await CollectionModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug: parsed.data.slug,
  });
  if (existing) {
    return {
      success: false,
      error: "A collection with this slug already exists",
    };
  }

  const doc = await CollectionModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "collection", String(doc._id), doc.name.en);
  revalidatePath(ROUTES.admin.collections);
  return {
    success: true,
    data: toCollection(doc.toObject() as unknown as CollectionDoc),
  };
}

export async function updateCollection(
  id: string,
  values: CollectionFormInput,
): Promise<ActionResult<Collection>> {
  const session = await requirePermission("collections.manage");

  const parsed = collectionFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid collection data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await CollectionModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Collection not found" };
  }

  logAudit(session, "updated", "collection", String(doc._id), doc.name.en);
  revalidatePath(ROUTES.admin.collections);
  return {
    success: true,
    data: toCollection(doc.toObject() as unknown as CollectionDoc),
  };
}

/** Soft delete — moves the collection to the Recycle Bin instead of destroying it outright. */
export async function deleteCollection(id: string): Promise<ActionResult> {
  const session = await requirePermission("collections.manage");
  await connectToDatabase();

  const doc = await CollectionModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Collection not found" };
  }

  logAudit(session, "deleted", "collection", id, doc.name.en);
  revalidatePath(ROUTES.admin.collections);
  return { success: true, data: undefined };
}
