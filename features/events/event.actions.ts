"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { EventModel } from "@/features/events/event.model";
import {
  eventFormSchema,
  type EventFormInput,
} from "@/features/events/event.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { StoreEvent } from "@/features/events/event.types";

interface EventDoc {
  _id: unknown;
  tenantId: string;
  slug: string;
  title: StoreEvent["title"];
  description: StoreEvent["description"];
  date: Date;
  location: string;
  imageUrl?: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toStoreEvent(doc: EventDoc): StoreEvent {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    date: doc.date.toISOString(),
    location: doc.location,
    imageUrl: doc.imageUrl ?? undefined,
    isPublished: doc.isPublished,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listEvents({
  publishedOnly = true,
}: { publishedOnly?: boolean } = {}): Promise<StoreEvent[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (publishedOnly) filter.isPublished = true;

  const docs = await EventModel.find(filter).sort({ date: -1 }).lean();
  return docs.map((doc) => toStoreEvent(doc as unknown as EventDoc));
}

export async function getEventByIdForAdmin(
  id: string,
): Promise<StoreEvent | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await EventModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toStoreEvent(doc as unknown as EventDoc) : null;
}

export async function createEvent(
  values: EventFormInput,
): Promise<ActionResult<StoreEvent>> {
  const session = await requirePermission("events.manage");

  const parsed = eventFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid event data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await EventModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug: parsed.data.slug,
  });
  if (existing) {
    return { success: false, error: "An event with this slug already exists" };
  }

  const doc = await EventModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "event", String(doc._id), doc.title.en);
  revalidatePath(ROUTES.admin.events);
  return {
    success: true,
    data: toStoreEvent(doc.toObject() as unknown as EventDoc),
  };
}

export async function updateEvent(
  id: string,
  values: EventFormInput,
): Promise<ActionResult<StoreEvent>> {
  const session = await requirePermission("events.manage");

  const parsed = eventFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid event data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await EventModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Event not found" };
  }

  logAudit(session, "updated", "event", String(doc._id), doc.title.en);
  revalidatePath(ROUTES.admin.events);
  return {
    success: true,
    data: toStoreEvent(doc.toObject() as unknown as EventDoc),
  };
}

/** Soft delete — moves the event to the Recycle Bin instead of destroying it outright. */
export async function deleteEvent(id: string): Promise<ActionResult> {
  const session = await requirePermission("events.manage");
  await connectToDatabase();

  const doc = await EventModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Event not found" };
  }

  logAudit(session, "deleted", "event", id, doc.title.en);
  revalidatePath(ROUTES.admin.events);
  return { success: true, data: undefined };
}
