"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { OfferModel } from "@/features/offers/offer.model";
import {
  offerFormSchema,
  type OfferFormInput,
} from "@/features/offers/offer.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { Offer } from "@/features/offers/offer.types";

interface OfferDoc {
  _id: unknown;
  tenantId: string;
  slug: string;
  title: Offer["title"];
  description: Offer["description"];
  terms?: Offer["terms"] | null;
  validUntil: Date;
  imageUrl?: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

function toOffer(doc: OfferDoc): Offer {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    terms: doc.terms ?? undefined,
    validUntil: doc.validUntil.toISOString(),
    imageUrl: doc.imageUrl ?? undefined,
    isPublished: doc.isPublished,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listOffers({
  publishedOnly = true,
}: { publishedOnly?: boolean } = {}): Promise<Offer[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (publishedOnly) filter.isPublished = true;

  const docs = await OfferModel.find(filter).sort({ sortOrder: 1 }).lean();
  return docs.map((doc) => toOffer(doc as unknown as OfferDoc));
}

export async function getOfferByIdForAdmin(id: string): Promise<Offer | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await OfferModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toOffer(doc as unknown as OfferDoc) : null;
}

export async function createOffer(
  values: OfferFormInput,
): Promise<ActionResult<Offer>> {
  const session = await requirePermission("offers.manage");

  const parsed = offerFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid offer data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await OfferModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug: parsed.data.slug,
  });
  if (existing) {
    return { success: false, error: "An offer with this slug already exists" };
  }

  const doc = await OfferModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "offer", String(doc._id), doc.title.en);
  revalidatePath(ROUTES.admin.offers);
  return {
    success: true,
    data: toOffer(doc.toObject() as unknown as OfferDoc),
  };
}

export async function updateOffer(
  id: string,
  values: OfferFormInput,
): Promise<ActionResult<Offer>> {
  const session = await requirePermission("offers.manage");

  const parsed = offerFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid offer data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await OfferModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Offer not found" };
  }

  logAudit(session, "updated", "offer", String(doc._id), doc.title.en);
  revalidatePath(ROUTES.admin.offers);
  return {
    success: true,
    data: toOffer(doc.toObject() as unknown as OfferDoc),
  };
}

/** Soft delete — moves the offer to the Recycle Bin instead of destroying it outright. */
export async function deleteOffer(id: string): Promise<ActionResult> {
  const session = await requirePermission("offers.manage");
  await connectToDatabase();

  const doc = await OfferModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Offer not found" };
  }

  logAudit(session, "deleted", "offer", id, doc.title.en);
  revalidatePath(ROUTES.admin.offers);
  return { success: true, data: undefined };
}
