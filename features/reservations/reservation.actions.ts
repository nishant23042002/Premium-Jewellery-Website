"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongoose";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { getCustomerSession, requireCustomer } from "@/lib/auth/customer-session";
import { verifyReservationActionToken } from "@/lib/auth/reservation-action-token";
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
import { logAudit, logSystemAudit } from "@/features/audit-logs/audit-log.actions";
import type { ActionResult, PaginatedResult } from "@/types/common";
import {
  RESERVATION_STATUS_TRANSITIONS,
  type Reservation,
  type ReservationStatus,
} from "@/features/reservations/reservation.types";

interface ReservationDoc {
  _id: unknown;
  tenantId: string;
  customerId?: unknown;
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
    customerId: doc.customerId ? String(doc.customerId) : undefined,
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
  const rateLimit = await checkRateLimit(`reservation:${ip}`, {
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

  const [products, customerSession] = await Promise.all([
    productIds.length > 0
      ? ProductModel.find({
          tenantId: DEFAULT_TENANT_ID,
          _id: { $in: productIds },
        })
          .select("_id name slug")
          .lean()
      : Promise.resolve([]),
    // Guest reservations are the common case — this is best-effort, not required.
    getCustomerSession(),
  ]);

  const doc = await ReservationModel.create({
    ...rest,
    email: rest.email || undefined,
    tenantId: DEFAULT_TENANT_ID,
    customerId: customerSession?.sub,
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

/** Best-effort live image lookup for the admin list — the product snapshot on a reservation deliberately doesn't store an image, so this joins against current product records instead. Products deleted since the reservation was made are simply left without an image, not an error. */
async function attachProductImages(
  reservations: Reservation[],
): Promise<Reservation[]> {
  const productIds = Array.from(
    new Set(reservations.flatMap((r) => r.products.map((p) => p.productId))),
  );
  if (productIds.length === 0) return reservations;

  const products = await ProductModel.find({
    _id: { $in: productIds },
    tenantId: DEFAULT_TENANT_ID,
  })
    .select("images")
    .lean();
  const imageById = new Map(
    products.map((p) => [String(p._id), p.images?.[0]?.url]),
  );

  return reservations.map((reservation) => ({
    ...reservation,
    products: reservation.products.map((p) => ({
      ...p,
      imageUrl: imageById.get(p.productId),
    })),
  }));
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

  const items = await attachProductImages(
    docs.map((doc) => toReservation(doc as unknown as ReservationDoc)),
  );

  return {
    items,
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

/** Powers the "My Reservations" account page — guest reservations (no customerId) never show up here, only ones made while signed in. */
export async function listReservationsForCustomer(): Promise<Reservation[]> {
  const session = await requireCustomer();
  await connectToDatabase();

  const docs = await ReservationModel.find({
    tenantId: DEFAULT_TENANT_ID,
    customerId: session.sub,
  })
    .sort({ createdAt: -1 })
    .lean();

  return attachProductImages(
    docs.map((doc) => toReservation(doc as unknown as ReservationDoc)),
  );
}

/**
 * Self-service cancel from the "My Reservations" account page. Two guards
 * beyond the usual transition check: ownership (the reservation's
 * customerId must match the caller's session — a customer can never cancel
 * someone else's booking, including guest reservations with no customerId
 * at all) and the normal RESERVATION_STATUS_TRANSITIONS legality check
 * (mirrors the admin/email-action paths so all three can never disagree).
 */
export async function cancelReservationAsCustomer(
  id: string,
): Promise<ActionResult<Reservation>> {
  const session = await requireCustomer();
  await connectToDatabase();

  const existing = await ReservationModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  if (!existing) {
    return { success: false, error: "Reservation not found" };
  }

  const current = toReservation(existing as unknown as ReservationDoc);
  if (current.customerId !== session.sub) {
    return { success: false, error: "You can't cancel this reservation" };
  }

  const allowedTargets = RESERVATION_STATUS_TRANSITIONS[current.status];
  if (!allowedTargets.includes("cancelled")) {
    return {
      success: false,
      error: `This reservation is already "${current.status}" and can no longer be cancelled.`,
    };
  }

  const reservation = await changeReservationStatus(
    id,
    "cancelled",
    undefined,
    "Customer (self-service)",
  );
  if (!reservation) {
    return { success: false, error: "Reservation not found" };
  }

  notifyReservationStatusChanged(reservation, "cancelled").catch((error) =>
    logger.error("notifyReservationStatusChanged", "failed", { error }),
  );
  logSystemAudit(
    "status_changed",
    "reservation",
    id,
    reservation.name,
    { status: "cancelled", via: "customer_self_service", customerId: session.sub },
  );

  revalidatePath("/admin/reservations");
  revalidatePath("/account/reservations");
  return { success: true, data: reservation };
}

/**
 * Powers the header's reservation-status indicator. Returns null when the
 * customer isn't signed in, has no reservations, or their most recent
 * reservation is already in a resolved state (completed/cancelled) — those
 * don't need a persistent badge since the customer was already notified by
 * email/WhatsApp when the change happened.
 */
export async function getActiveReservationStatusForCustomer(): Promise<ReservationStatus | null> {
  const session = await getCustomerSession();
  if (!session) return null;

  await connectToDatabase();
  const doc = await ReservationModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    customerId: session.sub,
  })
    .sort({ createdAt: -1 })
    .select("status")
    .lean();

  if (!doc || (doc.status !== "pending" && doc.status !== "confirmed")) {
    return null;
  }
  return doc.status as ReservationStatus;
}

/**
 * Shared by the admin-authenticated `updateReservationStatus` and the
 * token-authorized `applyReservationStatusViaEmailAction` — both need the
 * exact same write + activity-log entry, but authorize and audit-log the
 * change differently, so only the DB mutation itself is factored out.
 */
async function changeReservationStatus(
  id: string,
  targetStatus: ReservationStatus,
  note: string | undefined,
  byAdminName: string,
): Promise<Reservation | null> {
  await connectToDatabase();

  const doc = await ReservationModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    {
      status: targetStatus,
      $push: {
        activityLog: {
          action: `status changed to ${targetStatus}`,
          note,
          byAdminName,
          at: new Date(),
        },
      },
    },
    { returnDocument: "after" },
  );

  return doc ? toReservation(doc.toObject()) : null;
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

  const reservation = await changeReservationStatus(
    id,
    parsed.data.status,
    parsed.data.note,
    session.email,
  );
  if (!reservation) {
    return { success: false, error: "Reservation not found" };
  }

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

/**
 * Login-free counterpart to `updateReservationStatus`, authorized by a
 * signed token (see lib/auth/reservation-action-token.ts) instead of an
 * admin session — this is what the Confirm/Cancel/Complete links embedded
 * in the "new reservation" admin email hit. Re-validates the transition
 * against RESERVATION_STATUS_TRANSITIONS server-side (never trusts that the
 * link's target status is still legal — the reservation may have moved on
 * since the email was sent) and treats "already in that state" as success
 * rather than an error, since clicking the same email link twice is
 * expected, not a bug.
 */
export async function applyReservationStatusViaEmailAction(
  token: string,
): Promise<ActionResult<Reservation>> {
  const payload = verifyReservationActionToken(token);
  if (!payload) {
    return {
      success: false,
      error: "This link is invalid or has expired. Please use the admin dashboard instead.",
    };
  }

  await connectToDatabase();
  const existing = await ReservationModel.findOne({
    _id: payload.reservationId,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  if (!existing) {
    return { success: false, error: "Reservation not found." };
  }

  const current = toReservation(existing as unknown as ReservationDoc);

  if (current.status === payload.targetStatus) {
    return { success: true, data: current };
  }

  const allowedTargets = RESERVATION_STATUS_TRANSITIONS[current.status];
  if (!allowedTargets.includes(payload.targetStatus)) {
    return {
      success: false,
      error: `This reservation is now "${current.status}" and can no longer be changed to "${payload.targetStatus}" from this link. Please use the admin dashboard instead.`,
    };
  }

  const reservation = await changeReservationStatus(
    payload.reservationId,
    payload.targetStatus,
    undefined,
    "Admin (via email)",
  );
  if (!reservation) {
    return { success: false, error: "Reservation not found." };
  }

  notifyReservationStatusChanged(reservation, payload.targetStatus).catch(
    (error) =>
      logger.error("notifyReservationStatusChanged", "failed", { error }),
  );
  logSystemAudit(
    "status_changed",
    "reservation",
    payload.reservationId,
    reservation.name,
    { status: payload.targetStatus, via: "email_action" },
  );

  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${payload.reservationId}`);
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
