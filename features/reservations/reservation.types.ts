export type ReservationStatus =
  "pending" | "confirmed" | "completed" | "cancelled";

/** Denormalized product snapshot — survives the product being edited/removed later, and avoids a join for the admin dashboard. */
export interface ReservationProductRef {
  productId: string;
  name: string;
  slug: string;
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
