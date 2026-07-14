const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  return INR_FORMATTER.format(amount);
}

export function formatWeight(grams: number): string {
  return `${grams.toFixed(2)} g`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(iso: string | Date): string {
  return DATE_FORMATTER.format(new Date(iso));
}

const DATETIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "Tue, 14 Jul, 3:45 pm" — for event timestamps (enquiries, reservations, audit log) where the day of week and time of day matter, not just the date. */
export function formatDateTime(iso: string | Date): string {
  return DATETIME_FORMATTER.format(new Date(iso));
}

/** "Just now" / "5m ago" / "3h ago" / "2d ago", falling back to a full date past a week — for activity-feed style timestamps. */
export function formatRelativeTime(iso: string | Date): string {
  const date = new Date(iso);
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}
