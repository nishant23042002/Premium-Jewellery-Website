"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { TestimonialModel } from "@/features/testimonials/testimonial.model";
import {
  testimonialFormSchema,
  type TestimonialFormInput,
} from "@/features/testimonials/testimonial.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { Testimonial } from "@/features/testimonials/testimonial.types";

interface TestimonialDoc {
  _id: unknown;
  tenantId: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toTestimonial(doc: TestimonialDoc): Testimonial {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    name: doc.name,
    location: doc.location,
    rating: doc.rating,
    quote: doc.quote,
    sortOrder: doc.sortOrder,
    isPublished: doc.isPublished,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listTestimonials({
  publishedOnly = true,
}: { publishedOnly?: boolean } = {}): Promise<Testimonial[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (publishedOnly) filter.isPublished = true;

  const docs = await TestimonialModel.find(filter)
    .sort({ sortOrder: 1 })
    .lean();
  return docs.map((doc) => toTestimonial(doc as unknown as TestimonialDoc));
}

export async function getTestimonialByIdForAdmin(
  id: string,
): Promise<Testimonial | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await TestimonialModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toTestimonial(doc as unknown as TestimonialDoc) : null;
}

export async function createTestimonial(
  values: TestimonialFormInput,
): Promise<ActionResult<Testimonial>> {
  const session = await requirePermission("testimonials.manage");

  const parsed = testimonialFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid testimonial data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await TestimonialModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "testimonial", String(doc._id), doc.name);
  revalidatePath(ROUTES.admin.testimonials);
  return {
    success: true,
    data: toTestimonial(doc.toObject() as unknown as TestimonialDoc),
  };
}

export async function updateTestimonial(
  id: string,
  values: TestimonialFormInput,
): Promise<ActionResult<Testimonial>> {
  const session = await requirePermission("testimonials.manage");

  const parsed = testimonialFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid testimonial data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await TestimonialModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Testimonial not found" };
  }

  logAudit(session, "updated", "testimonial", String(doc._id), doc.name);
  revalidatePath(ROUTES.admin.testimonials);
  return {
    success: true,
    data: toTestimonial(doc.toObject() as unknown as TestimonialDoc),
  };
}

/** Soft delete — moves the testimonial to the Recycle Bin instead of destroying it outright. */
export async function deleteTestimonial(id: string): Promise<ActionResult> {
  const session = await requirePermission("testimonials.manage");
  await connectToDatabase();

  const doc = await TestimonialModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Testimonial not found" };
  }

  logAudit(session, "deleted", "testimonial", id, doc.name);
  revalidatePath(ROUTES.admin.testimonials);
  return { success: true, data: undefined };
}
