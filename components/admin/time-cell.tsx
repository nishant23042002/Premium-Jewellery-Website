import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";

/** Day + time on top, "how long ago" underneath — for event timestamps (enquiries received, reservations submitted, audit log entries) where both matter. Full precise timestamp is in the title tooltip. */
export function TimeCell({ at }: { at: string | Date }) {
  return (
    <span title={formatDateTime(at)}>
      <span className="block text-sm">{formatDateTime(at)}</span>
      <span className="block text-xs text-muted-foreground">
        {formatRelativeTime(at)}
      </span>
    </span>
  );
}
