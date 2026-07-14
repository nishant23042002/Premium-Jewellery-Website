import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

/**
 * Notifications themselves are a computed view (see listAdminNotifications
 * in audit-log.actions.ts), synthesized fresh from Orders/Reservations/
 * Enquiries/CustomerAccounts/AuditLog on every call rather than stored — so
 * "read" state can't live on a notification document that doesn't exist.
 * This is the minimal side table instead: one row per (admin, notification)
 * that's been marked read. Read state is per-admin on purpose — different
 * staff accounts shouldn't affect each other's unread counts.
 */
const notificationReadSchema = new Schema(
  {
    tenantId: tenantField,
    adminId: { type: String, required: true, trim: true },
    notificationId: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

notificationReadSchema.index(
  { tenantId: 1, adminId: 1, notificationId: 1 },
  { unique: true },
);
// listAdminNotifications only ever looks back NOTIFICATION_WINDOW_DAYS (7)
// days, so a read record can never be referenced again once it's older than
// that — this TTL just stops the collection growing forever. The extra
// margin over 7 days is only slack, not a correctness requirement.
notificationReadSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 14 },
);

export type NotificationReadDocument = InferSchemaType<
  typeof notificationReadSchema
>;

export const NotificationReadModel: Model<NotificationReadDocument> =
  models.NotificationRead ??
  model<NotificationReadDocument>("NotificationRead", notificationReadSchema);
