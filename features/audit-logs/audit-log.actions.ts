"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { AuditLogModel } from "@/features/audit-logs/audit-log.model";
import { ReservationModel } from "@/features/reservations/reservation.model";
import { EnquiryModel } from "@/features/enquiries/enquiry.model";
import { CustomerAccountModel } from "@/features/customer-auth/customer-account.model";
import { OrderModel } from "@/features/orders/order.model";
import { NotificationReadModel } from "@/features/audit-logs/notification-read.model";
import { ROUTES } from "@/constants/routes";
import { formatINR } from "@/lib/utils/format";
import type { PaginatedResult, ActionResult } from "@/types/common";
import type { AuditLogEntry } from "@/features/audit-logs/audit-log.types";
import type { SessionPayload } from "@/features/auth/admin-user.types";

interface AuditLogDoc {
  _id: unknown;
  tenantId: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  resourceLabel?: string | null;
  metadata?: Record<string, unknown> | null;
  at: Date;
}

function toEntry(doc: AuditLogDoc): AuditLogEntry {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    actorId: doc.actorId,
    actorEmail: doc.actorEmail,
    action: doc.action,
    resource: doc.resource,
    resourceId: doc.resourceId ?? undefined,
    resourceLabel: doc.resourceLabel ?? undefined,
    metadata: doc.metadata ?? undefined,
    at: doc.at.toISOString(),
  };
}

/**
 * Fire-and-forget audit trail called from mutating Server Actions across the
 * admin panel (PRD §43 — business-critical traceability distinct from
 * general app logs). Deliberately swallows its own errors: a logging
 * failure must never roll back or fail the mutation that already succeeded.
 */
export async function logAudit(
  session: SessionPayload,
  action: string,
  resource: string,
  resourceId?: string,
  resourceLabel?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLogModel.create({
      tenantId: session.tenantId,
      actorId: session.sub,
      actorEmail: session.email,
      action,
      resource,
      resourceId,
      resourceLabel,
      metadata,
      at: new Date(),
    });
  } catch (error) {
    logger.error("logAudit", "failed to write audit log entry", {
      error,
      action,
      resource,
    });
  }
}

/**
 * Same audit trail as `logAudit`, for actions with no admin session behind
 * them — currently only the scheduled metal-rate fetch (app/api/cron/
 * refresh-metal-rates), which runs on a timer, not a staff click. Uses a
 * fixed "system" actor rather than skipping the audit trail entirely, since
 * an automated price change on live jewellery pricing is exactly the kind
 * of price-affecting action PRD §17 says must stay traceable.
 */
export async function logSystemAudit(
  action: string,
  resource: string,
  resourceId?: string,
  resourceLabel?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLogModel.create({
      tenantId: DEFAULT_TENANT_ID,
      actorId: "system",
      actorEmail: "system@automated",
      action,
      resource,
      resourceId,
      resourceLabel,
      metadata,
      at: new Date(),
    });
  } catch (error) {
    logger.error("logSystemAudit", "failed to write audit log entry", {
      error,
      action,
      resource,
    });
  }
}

export interface ListAuditLogsParams {
  resource?: string;
  page?: number;
  pageSize?: number;
}

export async function listAuditLogs({
  resource,
  page = 1,
  pageSize = 50,
}: ListAuditLogsParams = {}): Promise<PaginatedResult<AuditLogEntry>> {
  await requirePermission("audit.view");
  await connectToDatabase();

  const filter: Record<string, unknown> = { tenantId: DEFAULT_TENANT_ID };
  if (resource) filter.resource = resource;

  const [docs, total] = await Promise.all([
    AuditLogModel.find(filter)
      .sort({ at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AuditLogModel.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => toEntry(doc as unknown as AuditLogDoc)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Distinct resource names seen so far — powers the Audit Logs filter dropdown. */
export async function listAuditResources(): Promise<string[]> {
  await requirePermission("audit.view");
  await connectToDatabase();
  const resources = await AuditLogModel.distinct("resource", {
    tenantId: DEFAULT_TENANT_ID,
  });
  return (resources as string[]).sort();
}

export type AdminNotificationType =
  | "order_placed"
  | "order_status_changed"
  | "reservation_created"
  | "reservation_status_changed"
  | "enquiry_created"
  | "customer_created"
  | "rate_updated"
  | "rate_fetch_failed";

/** Powers the notification popover's category filter tabs — every type maps to exactly one of these. */
export type AdminNotificationCategory =
  | "order"
  | "reservation"
  | "enquiry"
  | "customer"
  | "rate";

const CATEGORY_BY_TYPE: Record<AdminNotificationType, AdminNotificationCategory> = {
  order_placed: "order",
  order_status_changed: "order",
  reservation_created: "reservation",
  reservation_status_changed: "reservation",
  enquiry_created: "enquiry",
  customer_created: "customer",
  rate_updated: "rate",
  rate_fetch_failed: "rate",
};

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  category: AdminNotificationCategory;
  severity: "info" | "destructive";
  title: string;
  message: string;
  at: string;
  href: string;
  /** Per the current admin — see NotificationReadModel. */
  read: boolean;
}

const NOTIFICATION_WINDOW_DAYS = 7;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * "metal_rate"/"updated" audit entries come in two unrelated metadata
 * shapes depending on who wrote them — the live auto-fetch cron
 * (metal-rate-sync.actions.ts) logs `{ rates: [{ metalType, ratePerGram }],
 * warnings }`, while the manual "Daily Rates" admin form
 * (metal-rate.actions.ts) logs flat `{ goldRatePerGram, silverRatePerGram,
 * platinumRatePerGram? }`. Both need handling here or the message silently
 * falls back to something uninformative.
 */
function describeRateUpdate(
  metadata: Record<string, unknown> | null | undefined,
  resourceLabel?: string | null,
): string {
  if (metadata) {
    if (Array.isArray(metadata.rates)) {
      const metals = (metadata.rates as { metalType?: string }[])
        .map((r) => r.metalType)
        .filter((m): m is string => !!m);
      if (metals.length > 0) {
        const label = metals.map(capitalize).join(", ");
        return `${label} rate${metals.length > 1 ? "s" : ""} refreshed`;
      }
    }

    const manualMetals = (["gold", "silver", "platinum"] as const).filter(
      (m) => typeof metadata[`${m}RatePerGram`] === "number",
    );
    if (manualMetals.length > 0) {
      const label = manualMetals.map(capitalize).join(", ");
      return `${label} rate${manualMetals.length > 1 ? "s" : ""} updated manually`;
    }
  }

  return resourceLabel ?? "Live rates refreshed";
}

/**
 * Backs the admin topbar's Notifications popover. Pulls from several
 * sources rather than one audit-log query, since `createReservation`,
 * `createEnquiry`, and order creation (via the Razorpay verify/webhook
 * routes) don't write audit entries (creates aren't "actions by an admin" —
 * see logAudit's docstring), so "new reservation"/"new enquiry"/"new order"
 * have to come straight from the collections themselves; status changes,
 * refunds, and rate updates/failures do go through the audit log already.
 * Any admin can see all of these (not gated per-resource permission) since
 * the point is a single at-a-glance feed of what needs attention, not a
 * permissioned view.
 */
export async function listAdminNotifications(
  limit = 30,
): Promise<AdminNotification[]> {
  const session = await requireAdmin();
  await connectToDatabase();

  const since = new Date();
  since.setDate(since.getDate() - NOTIFICATION_WINDOW_DAYS);
  const perSourceLimit = limit;

  const [
    newOrders,
    orderStatusChanges,
    newReservations,
    reservationStatusChanges,
    newEnquiries,
    newCustomers,
    rateUpdates,
    rateFailures,
    readRecords,
  ] = await Promise.all([
    OrderModel.find({ tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } })
      .select("orderNumber customerSnapshot pricing createdAt")
      .sort({ createdAt: -1 })
      .limit(perSourceLimit)
      .lean(),
    AuditLogModel.find({
      tenantId: DEFAULT_TENANT_ID,
      resource: "order",
      action: { $in: ["status_changed", "refunded"] },
      at: { $gte: since },
    })
      .sort({ at: -1 })
      .limit(perSourceLimit)
      .lean(),
    ReservationModel.find({ tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } })
      .select("name createdAt")
      .sort({ createdAt: -1 })
      .limit(perSourceLimit)
      .lean(),
    AuditLogModel.find({
      tenantId: DEFAULT_TENANT_ID,
      resource: "reservation",
      action: "status_changed",
      at: { $gte: since },
    })
      .sort({ at: -1 })
      .limit(perSourceLimit)
      .lean(),
    EnquiryModel.find({ tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } })
      .select("name createdAt")
      .sort({ createdAt: -1 })
      .limit(perSourceLimit)
      .lean(),
    CustomerAccountModel.find({ tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } })
      .select("name createdAt")
      .sort({ createdAt: -1 })
      .limit(perSourceLimit)
      .lean(),
    AuditLogModel.find({
      tenantId: DEFAULT_TENANT_ID,
      resource: "metal_rate",
      action: "updated",
      at: { $gte: since },
    })
      .sort({ at: -1 })
      .limit(perSourceLimit)
      .lean(),
    AuditLogModel.find({
      tenantId: DEFAULT_TENANT_ID,
      resource: "metal_rate",
      action: "error",
      at: { $gte: since },
    })
      .sort({ at: -1 })
      .limit(perSourceLimit)
      .lean(),
    NotificationReadModel.find({
      tenantId: DEFAULT_TENANT_ID,
      adminId: session.sub,
    })
      .select("notificationId")
      .lean(),
  ]);

  const readIds = new Set(readRecords.map((doc) => doc.notificationId));

  function withCategory(
    type: AdminNotificationType,
    rest: Omit<AdminNotification, "type" | "category" | "read">,
  ): AdminNotification {
    return {
      type,
      category: CATEGORY_BY_TYPE[type],
      read: readIds.has(rest.id),
      ...rest,
    };
  }

  const notifications: AdminNotification[] = [
    ...newOrders.map((doc) =>
      withCategory("order_placed", {
        id: `order_placed:${String(doc._id)}`,
        severity: "info",
        title: "New order placed",
        message: `${doc.customerSnapshot?.name ?? "A customer"} — ${doc.orderNumber} (${formatINR(doc.pricing?.grandTotal ?? 0)})`,
        at: doc.createdAt.toISOString(),
        href: ROUTES.admin.order(String(doc._id)),
      }),
    ),
    ...orderStatusChanges.map((doc) =>
      withCategory("order_status_changed", {
        id: `order_status_changed:${String(doc._id)}`,
        severity: "info",
        title: doc.action === "refunded" ? "Order refunded" : "Order updated",
        message: `${doc.resourceLabel ?? "An order"} marked ${(doc.metadata?.status as string | undefined) ?? "updated"}`,
        at: doc.at.toISOString(),
        href: doc.resourceId
          ? ROUTES.admin.order(doc.resourceId)
          : ROUTES.admin.orders,
      }),
    ),
    ...newReservations.map((doc) =>
      withCategory("reservation_created", {
        id: `reservation_created:${String(doc._id)}`,
        severity: "info",
        title: "New reservation request",
        message: `${doc.name} requested a visit`,
        at: doc.createdAt.toISOString(),
        href: ROUTES.admin.reservation(String(doc._id)),
      }),
    ),
    ...reservationStatusChanges.map((doc) =>
      withCategory("reservation_status_changed", {
        id: `reservation_status_changed:${String(doc._id)}`,
        severity: "info",
        title: "Reservation updated",
        message: `${doc.resourceLabel ?? "A reservation"} marked ${(doc.metadata?.status as string | undefined) ?? "updated"}`,
        at: doc.at.toISOString(),
        href: doc.resourceId
          ? ROUTES.admin.reservation(doc.resourceId)
          : ROUTES.admin.reservations,
      }),
    ),
    ...newEnquiries.map((doc) =>
      withCategory("enquiry_created", {
        id: `enquiry_created:${String(doc._id)}`,
        severity: "info",
        title: "New enquiry",
        message: `${doc.name} sent an enquiry`,
        at: doc.createdAt.toISOString(),
        href: ROUTES.admin.enquiries,
      }),
    ),
    ...newCustomers.map((doc) =>
      withCategory("customer_created", {
        id: `customer_created:${String(doc._id)}`,
        severity: "info",
        title: "New customer",
        message: `${doc.name} created an account`,
        at: doc.createdAt.toISOString(),
        href: ROUTES.admin.customer(String(doc._id)),
      }),
    ),
    ...rateUpdates.map((doc) =>
      withCategory("rate_updated", {
        id: `rate_updated:${String(doc._id)}`,
        severity: "info",
        title: "Metal rates updated",
        message: describeRateUpdate(doc.metadata, doc.resourceLabel),
        at: doc.at.toISOString(),
        href: ROUTES.admin.rates,
      }),
    ),
    ...rateFailures.map((doc) =>
      withCategory("rate_fetch_failed", {
        id: `rate_fetch_failed:${String(doc._id)}`,
        severity: "destructive",
        title: "Live rate fetch failed",
        message:
          (doc.metadata?.error as string | undefined) ??
          doc.resourceLabel ??
          "Live metal rate fetch failed",
        at: doc.at.toISOString(),
        href: ROUTES.admin.rates,
      }),
    ),
  ];

  notifications.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return notifications.slice(0, limit);
}

/** Marks one notification read for the current admin only — see NotificationReadModel for why this is a separate side table rather than a field on a stored notification. */
export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  await connectToDatabase();

  await NotificationReadModel.updateOne(
    {
      tenantId: DEFAULT_TENANT_ID,
      adminId: session.sub,
      notificationId,
    },
    {
      $setOnInsert: {
        tenantId: DEFAULT_TENANT_ID,
        adminId: session.sub,
        notificationId,
      },
    },
    { upsert: true },
  );

  return { success: true, data: undefined };
}

/** Marks every notification currently in the 7-day window read for the current admin — re-lists rather than trusting client-supplied ids, so a stale popover can't mark something newer read by accident. */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const session = await requireAdmin();
  const notifications = await listAdminNotifications(100);
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) {
    return { success: true, data: undefined };
  }

  await connectToDatabase();
  await NotificationReadModel.bulkWrite(
    unread.map((n) => ({
      updateOne: {
        filter: {
          tenantId: DEFAULT_TENANT_ID,
          adminId: session.sub,
          notificationId: n.id,
        },
        update: {
          $setOnInsert: {
            tenantId: DEFAULT_TENANT_ID,
            adminId: session.sub,
            notificationId: n.id,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return { success: true, data: undefined };
}
