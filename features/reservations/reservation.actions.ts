"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongoose";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { ProductModel } from "@/features/products/product.model";
import { ReservationModel } from "@/features/reservations/reservation.model";
import {
  reservationFormSchema,
  reservationStatusUpdateSchema,
  type ReservationFormInput,
  type ReservationStatusUpdateValues,
} from "@/features/reservations/reservation.schema";
import {
  notifyReservationCreated,
  notifyReservationStatusChanged,
} from "@/lib/notifications/notify";
import { upsertCustomerFromContact } from "@/features/customers/customer.actions";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import type { ActionResult, PaginatedResult } from "@/types/common";
import type {
  Reservation,
  ReservationStatus,
} from "@/features/reservations/reservation.types";

interface ReservationDoc {
  _id: unknown;
  tenantId: string;
  name: string;
  phone: string;
  email?: string | null;
  preferredDate: Date;
  preferredTimeSlot: string;
  branchId: string;
  products: { productId: unknown; name: string; slug: string }[];
  message?: string | null;
  status: ReservationStatus;
  activityLog: {
    action: string;
    note?: string | null;
    byAdminName?: string | null;
    at: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

function toReservation(doc: ReservationDoc): Reservation {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    name: doc.name,
    phone: doc.phone,
    email: doc.email ?? undefined,
    preferredDate: doc.preferredDate.toISOString(),
    preferredTimeSlot: doc.preferredTimeSlot,
    branchId: doc.branchId,
    products: doc.products.map((p) => ({
      productId: String(p.productId),
      name: p.name,
      slug: p.slug,
    })),
    message: doc.message ?? undefined,
    status: doc.status,
    activityLog: doc.activityLog.map((entry) => ({
      action: entry.action,
      note: entry.note ?? undefined,
      byAdminName: entry.byAdminName ?? undefined,
      at: entry.at.toISOString(),
    })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Public — the Reservation page's submit handler. */
export async function createReservation(
  values: ReservationFormInput,
): Promise<ActionResult<Reservation>> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for") ??
    headerList.get("x-real-ip") ??
    "unknown";
  const rateLimit = checkRateLimit(`reservation:${ip}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Too many requests. Please try again in a minute.",
    };
  }

  const parsed = reservationFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the form for errors",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const { productIds, ...rest } = parsed.data;

  const products =
    productIds.length > 0
      ? await ProductModel.find({
          tenantId: DEFAULT_TENANT_ID,
          _id: { $in: productIds },
        })
          .select("_id name slug")
          .lean()
      : [];

  const doc = await ReservationModel.create({
    ...rest,
    email: rest.email || undefined,
    tenantId: DEFAULT_TENANT_ID,
    products: products.map((p) => ({
      productId: p._id,
      name: p.name.en,
      slug: p.slug,
    })),
    status: "pending",
    activityLog: [{ action: "created", at: new Date() }],
  });

  const reservation = toReservation(doc.toObject());

  // Fire-and-forget-adjacent: notification/directory failures shouldn't
  // fail the reservation itself — the record is already saved and visible
  // to admin.
  notifyReservationCreated(reservation).catch((error) =>
    logger.error("notifyReservationCreated", "failed", { error }),
  );
  upsertCustomerFromContact({
    name: reservation.name,
    phone: reservation.phone,
    email: reservation.email,
    source: "reservation",
  }).catch((error) =>
    logger.error("upsertCustomerFromContact", "failed", { error }),
  );

  revalidatePath("/admin/reservations");
  return { success: true, data: reservation };
}

export interface ListReservationsParams {
  status?: ReservationStatus;
  page?: number;
  pageSize?: number;
}

export async function listReservations({
  status,
  page = 1,
  pageSize = 20,
}: ListReservationsParams = {}): Promise<PaginatedResult<Reservation>> {
  await requireAdmin();
  await connectToDatabase();

  const filter: Record<string, unknown> = { tenantId: DEFAULT_TENANT_ID };
  if (status) filter.status = status;

  const [docs, total] = await Promise.all([
    ReservationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ReservationModel.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => toReservation(doc as unknown as ReservationDoc)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getReservationById(
  id: string,
): Promise<Reservation | null> {
  await requireAdmin();
  await connectToDatabase();

  const doc = await ReservationModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toReservation(doc as unknown as ReservationDoc) : null;
}

export async function updateReservationStatus(
  id: string,
  values: ReservationStatusUpdateValues,
): Promise<ActionResult<Reservation>> {
  const session = await requirePermission("reservations.manage");

  const parsed = reservationStatusUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid status update" };
  }

  await connectToDatabase();

  const doc = await ReservationModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    {
      status: parsed.data.status,
      $push: {
        activityLog: {
          action: `status changed to ${parsed.data.status}`,
          note: parsed.data.note,
          byAdminName: session.email,
          at: new Date(),
        },
      },
    },
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Reservation not found" };
  }

  const reservation = toReservation(doc.toObject());

  notifyReservationStatusChanged(reservation, parsed.data.status).catch(
    (error) =>
      logger.error("notifyReservationStatusChanged", "failed", { error }),
  );
  logAudit(session, "status_changed", "reservation", id, reservation.name, {
    status: parsed.data.status,
  });

  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${id}`);
  return { success: true, data: reservation };
}

export async function addReservationNote(
  id: string,
  note: string,
): Promise<ActionResult> {
  const session = await requirePermission("reservations.manage");

  if (!note.trim()) {
    return { success: false, error: "Note cannot be empty" };
  }

  await connectToDatabase();

  const doc = await ReservationModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    {
      $push: {
        activityLog: {
          action: "note added",
          note: note.trim(),
          byAdminName: session.email,
          at: new Date(),
        },
      },
    },
  );

  if (!doc) {
    return { success: false, error: "Reservation not found" };
  }

  logAudit(session, "note_added", "reservation", id);

  revalidatePath(`/admin/reservations/${id}`);
  return { success: true, data: undefined };
}
