import type { ReservationStatus } from "@/features/reservations/reservation.types";

export interface TimeSlot {
  value: string;
  label: string;
}

/** Matches the showroom's stated hours (SITE.hours) — half-hour granularity would be overkill for a single-counter showroom. */
export const TIME_SLOTS: TimeSlot[] = [
  { value: "10:00-11:00", label: "10:00 AM – 11:00 AM" },
  { value: "11:00-12:00", label: "11:00 AM – 12:00 PM" },
  { value: "12:00-13:00", label: "12:00 PM – 1:00 PM" },
  { value: "14:00-15:00", label: "2:00 PM – 3:00 PM" },
  { value: "15:00-16:00", label: "3:00 PM – 4:00 PM" },
  { value: "16:00-17:00", label: "4:00 PM – 5:00 PM" },
  { value: "17:00-18:00", label: "5:00 PM – 6:00 PM" },
  { value: "18:00-19:00", label: "6:00 PM – 7:00 PM" },
  { value: "19:00-20:00", label: "7:00 PM – 8:00 PM" },
];

export const RESERVATION_STATUS_META: Record<
  ReservationStatus,
  {
    label: string;
    badgeVariant: "outline" | "gold" | "success" | "secondary" | "destructive";
  }
> = {
  pending: { label: "Pending Review", badgeVariant: "outline" },
  confirmed: { label: "Confirmed", badgeVariant: "gold" },
  completed: { label: "Completed", badgeVariant: "success" },
  cancelled: { label: "Cancelled", badgeVariant: "destructive" },
};

export const RESERVATION_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];
