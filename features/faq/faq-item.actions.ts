"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { FaqItemModel } from "@/features/faq/faq-item.model";
import {
  faqItemFormSchema,
  type FaqItemFormInput,
} from "@/features/faq/faq-item.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { FaqItem } from "@/features/faq/faq-item.types";

interface FaqItemDoc {
  _id: unknown;
  tenantId: string;
  question: FaqItem["question"];
  answer: FaqItem["answer"];
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toFaqItem(doc: FaqItemDoc): FaqItem {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    question: doc.question,
    answer: doc.answer,
    sortOrder: doc.sortOrder,
    isPublished: doc.isPublished,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listFaqItems({
  publishedOnly = true,
}: { publishedOnly?: boolean } = {}): Promise<FaqItem[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (publishedOnly) filter.isPublished = true;

  const docs = await FaqItemModel.find(filter).sort({ sortOrder: 1 }).lean();
  return docs.map((doc) => toFaqItem(doc as unknown as FaqItemDoc));
}

export async function getFaqItemByIdForAdmin(
  id: string,
): Promise<FaqItem | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await FaqItemModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toFaqItem(doc as unknown as FaqItemDoc) : null;
}

export async function createFaqItem(
  values: FaqItemFormInput,
): Promise<ActionResult<FaqItem>> {
  const session = await requirePermission("faq.manage");

  const parsed = faqItemFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid FAQ data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await FaqItemModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "faq_item", String(doc._id), doc.question.en);
  revalidatePath(ROUTES.admin.faq);
  return {
    success: true,
    data: toFaqItem(doc.toObject() as unknown as FaqItemDoc),
  };
}

export async function updateFaqItem(
  id: string,
  values: FaqItemFormInput,
): Promise<ActionResult<FaqItem>> {
  const session = await requirePermission("faq.manage");

  const parsed = faqItemFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid FAQ data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await FaqItemModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "FAQ item not found" };
  }

  logAudit(session, "updated", "faq_item", String(doc._id), doc.question.en);
  revalidatePath(ROUTES.admin.faq);
  return {
    success: true,
    data: toFaqItem(doc.toObject() as unknown as FaqItemDoc),
  };
}

/** Soft delete — moves the FAQ item to the Recycle Bin instead of destroying it outright. */
export async function deleteFaqItem(id: string): Promise<ActionResult> {
  const session = await requirePermission("faq.manage");
  await connectToDatabase();

  const doc = await FaqItemModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "FAQ item not found" };
  }

  logAudit(session, "deleted", "faq_item", id, doc.question.en);
  revalidatePath(ROUTES.admin.faq);
  return { success: true, data: undefined };
}
