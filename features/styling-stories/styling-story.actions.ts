"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { uploadVideoBuffer } from "@/lib/cloudinary/upload";
import { StylingStoryModel } from "@/features/styling-stories/styling-story.model";
import {
  stylingStoryFormSchema,
  type StylingStoryFormInput,
} from "@/features/styling-stories/styling-story.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type {
  StylingStory,
  StylingStoryResolved,
} from "@/features/styling-stories/styling-story.types";

interface StylingStoryDoc {
  _id: unknown;
  tenantId: string;
  title: StylingStory["title"];
  subtitle?: StylingStory["subtitle"] | null;
  coverImageUrl?: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toStylingStory(doc: StylingStoryDoc): StylingStory {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    title: doc.title,
    subtitle: doc.subtitle ?? undefined,
    // Legacy docs saved before the image reversion (or during the earlier
    // video-only phase) may not have this field yet — coalesce so admin
    // listings render instead of throwing; `listStylingStoriesResolved`
    // filters these out of the storefront.
    coverImageUrl: doc.coverImageUrl ?? "",
    sortOrder: doc.sortOrder,
    isPublished: doc.isPublished,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listStylingStories({
  publishedOnly = true,
}: { publishedOnly?: boolean } = {}): Promise<StylingStory[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (publishedOnly) filter.isPublished = true;

  const docs = await StylingStoryModel.find(filter)
    .sort({ sortOrder: 1 })
    .lean();
  return docs.map((doc) => toStylingStory(doc as unknown as StylingStoryDoc));
}

/** Storefront-ready variant — plain image reel cards, no product resolution needed. */
export async function listStylingStoriesResolved(
  locale: "en" | "hi" | "mr" = "en",
): Promise<StylingStoryResolved[]> {
  // A story published before it had a cover image set has nothing to show,
  // so it's excluded here rather than rendering a broken <img> on the
  // storefront.
  const stories = (await listStylingStories({ publishedOnly: true })).filter(
    (story) => story.coverImageUrl,
  );

  return stories.map((story) => ({
    id: story.id,
    title: story.title[locale] || story.title.en,
    subtitle: story.subtitle
      ? story.subtitle[locale] || story.subtitle.en || undefined
      : undefined,
    coverImageUrl: story.coverImageUrl,
  }));
}

export async function getStylingStoryByIdForAdmin(
  id: string,
): Promise<StylingStory | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await StylingStoryModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toStylingStory(doc as unknown as StylingStoryDoc) : null;
}

export async function createStylingStory(
  values: StylingStoryFormInput,
): Promise<ActionResult<StylingStory>> {
  const session = await requirePermission("styling_stories.manage");

  const parsed = stylingStoryFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid styling story data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await StylingStoryModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "styling_story", String(doc._id));
  revalidatePath(ROUTES.admin.stylingStories);
  revalidatePath(ROUTES.home);
  return {
    success: true,
    data: toStylingStory(doc.toObject() as unknown as StylingStoryDoc),
  };
}

export async function updateStylingStory(
  id: string,
  values: StylingStoryFormInput,
): Promise<ActionResult<StylingStory>> {
  const session = await requirePermission("styling_stories.manage");

  const parsed = stylingStoryFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid styling story data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await StylingStoryModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { ...parsed.data },
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Styling story not found" };
  }

  logAudit(session, "updated", "styling_story", String(doc._id));
  revalidatePath(ROUTES.admin.stylingStories);
  revalidatePath(ROUTES.home);
  return {
    success: true,
    data: toStylingStory(doc.toObject() as unknown as StylingStoryDoc),
  };
}

/** Soft delete — moves the story to the Recycle Bin instead of destroying it outright. */
export async function deleteStylingStory(id: string): Promise<ActionResult> {
  const session = await requirePermission("styling_stories.manage");
  await connectToDatabase();

  const doc = await StylingStoryModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Styling story not found" };
  }

  logAudit(session, "deleted", "styling_story", id);
  revalidatePath(ROUTES.admin.stylingStories);
  revalidatePath(ROUTES.home);
  return { success: true, data: undefined };
}

/** Accepts a browser FormData with a single "file" entry — the cover video uploader's submit handler. Separate from the image Media Library since Cloudinary tracks video as a distinct resource type. */
export async function uploadStylingStoryVideo(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  await requirePermission("styling_stories.manage");

  // `instanceof File` fails here: this action is invoked directly (not via
  // a <form> submission), and Next's Server Action wire protocol reconstructs
  // the uploaded entry as a `Blob` rather than a full `File` in that path.
  // `Blob` still has everything `uploadVideoBuffer` needs (`arrayBuffer()`,
  // `type`, `size`), so check against that instead.
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return { success: false, error: "No file provided" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadVideoBuffer(buffer, {
      folder: "Ambika-Jewellers/styling-stories",
      mimeType: file.type,
    });
    return { success: true, data: { url: uploaded.url } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
