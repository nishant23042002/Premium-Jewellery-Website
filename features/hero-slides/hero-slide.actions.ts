"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { HeroSlideModel } from "@/features/hero-slides/hero-slide.model";
import {
  heroSlideFormSchema,
  type HeroSlideFormInput,
} from "@/features/hero-slides/hero-slide.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { HeroSlide } from "@/features/hero-slides/hero-slide.types";

interface HeroSlideDoc {
  _id: unknown;
  tenantId: string;
  mobileImageUrl: string;
  desktopImageUrl: string;
  altText: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toHeroSlide(doc: HeroSlideDoc): HeroSlide {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    mobileImageUrl: doc.mobileImageUrl,
    desktopImageUrl: doc.desktopImageUrl,
    altText: doc.altText,
    sortOrder: doc.sortOrder,
    isPublished: doc.isPublished,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listHeroSlides({
  publishedOnly = true,
}: { publishedOnly?: boolean } = {}): Promise<HeroSlide[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (publishedOnly) filter.isPublished = true;

  const docs = await HeroSlideModel.find(filter).sort({ sortOrder: 1 }).lean();
  return docs.map((doc) => toHeroSlide(doc as unknown as HeroSlideDoc));
}

export async function getHeroSlideByIdForAdmin(
  id: string,
): Promise<HeroSlide | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await HeroSlideModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toHeroSlide(doc as unknown as HeroSlideDoc) : null;
}

export async function createHeroSlide(
  values: HeroSlideFormInput,
): Promise<ActionResult<HeroSlide>> {
  const session = await requirePermission("hero_slides.manage");

  const parsed = heroSlideFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid hero slide data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await HeroSlideModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "hero_slide", String(doc._id));
  revalidatePath(ROUTES.admin.heroSlides);
  revalidatePath(ROUTES.home);
  return {
    success: true,
    data: toHeroSlide(doc.toObject() as unknown as HeroSlideDoc),
  };
}

export async function updateHeroSlide(
  id: string,
  values: HeroSlideFormInput,
): Promise<ActionResult<HeroSlide>> {
  const session = await requirePermission("hero_slides.manage");

  const parsed = heroSlideFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid hero slide data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await HeroSlideModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Hero slide not found" };
  }

  logAudit(session, "updated", "hero_slide", String(doc._id));
  revalidatePath(ROUTES.admin.heroSlides);
  revalidatePath(ROUTES.home);
  return {
    success: true,
    data: toHeroSlide(doc.toObject() as unknown as HeroSlideDoc),
  };
}

/** Soft delete — moves the slide to the Recycle Bin instead of destroying it outright. */
export async function deleteHeroSlide(id: string): Promise<ActionResult> {
  const session = await requirePermission("hero_slides.manage");
  await connectToDatabase();

  const doc = await HeroSlideModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Hero slide not found" };
  }

  logAudit(session, "deleted", "hero_slide", id);
  revalidatePath(ROUTES.admin.heroSlides);
  revalidatePath(ROUTES.home);
  return { success: true, data: undefined };
}
