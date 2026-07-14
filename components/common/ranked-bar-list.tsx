import { cn } from "@/lib/utils";
import type { TrendChartDatum } from "@/components/common/trend-chart";

interface RankedBarListProps {
  data: TrendChartDatum[];
  emptyLabel?: string;
  /** Formats the trailing number — defaults to a plain count. */
  formatValue?: (value: number) => string;
  className?: string;
}

/**
 * Sorted "top N" list with proportional bars — more legible than a pie or
 * bar chart once there are more than a handful of items (product/category/
 * search-term rankings), and reads fine at any width without an axis.
 */
export function RankedBarList({
  data,
  emptyLabel = "Not enough data yet.",
  formatValue = (v) => String(v),
  className,
}: RankedBarListProps) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className={cn("space-y-2.5", className)}>
      {data.map((d, i) => (
        <li key={d.label} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-sm">{d.label}</span>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatValue(d.value)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${Math.max(4, (d.value / max) * 100)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
