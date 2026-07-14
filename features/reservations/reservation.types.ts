export type ReservationStatus =
  "pending" | "confirmed" | "completed" | "cancelled";

/**
 * Single source of truth for which status changes are legal from a given
 * state — the admin dashboard's action buttons (ReservationStatusActions)
 * derive their button set from this, and the signed email-action route
 * handler validates against it too, so the two can never drift apart.
 */
export const RESERVATION_STATUS_TRANSITIONS: Record<
  ReservationStatus,
  ReservationStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: ["pending"],
};

/** Denormalized product snapshot — survives the product being edited/removed later, and avoids a join for the admin dashboard. */
export interface ReservationProductRef {
  productId: string;
  name: string;
  slug: string;
  /** Best-effort, looked up live from the current product record — undefined if the product was since deleted. Not part of the stored snapshot. */
  imageUrl?: string;
}

export interface ReservationActivityEntry {
  action: string;
  note?: string;
  byAdminName?: string;
  at: string;
}

export interface Reservation {
  id: string;
  tenantId: string;
  /** Set only when the customer was logged in at submission time — guest reservations (the common case) leave this undefined. Powers "My Reservations" and the header status badge; never required for the reservation itself to work. */
  customerId?: string;
  name: string;
  phone: string;
  email?: string;
  preferredDate: string;
  preferredTimeSlot: string;
  branchId: string;
  products: ReservationProductRef[];
  message?: string;
  status: ReservationStatus;
  activityLog: ReservationActivityEntry[];
  createdAt: string;
  updatedAt: string;
}
