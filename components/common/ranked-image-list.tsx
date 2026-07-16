import Image from "next/image";
import Link from "next/link";
import { Gem } from "lucide-react";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { cn } from "@/lib/utils";

export interface RankedImageDatum {
  id?: string;
  label: string;
  value: number;
  imageUrl?: string;
  /** Admin edit-page link for this row (e.g. the product/category/collection) — makes a ranking directly actionable instead of just informational. */
  href?: string;
}

interface RankedImageListProps {
  data: RankedImageDatum[];
  emptyLabel?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

/**
 * RankedBarList's sibling for rankings where seeing the actual product/
 * category/collection photo matters more than reading its name — "which
 * ring is everyone reserving" is answered a beat faster by a thumbnail than
 * by text alone. Falls back to the same gold-toned placeholder used
 * everywhere else in the admin when a row has no image on file.
 */
export function RankedImageList({
  data,
  emptyLabel = "Not enough data yet.",
  formatValue = (v) => String(v),
  className,
}: RankedImageListProps) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className={cn("space-y-3", className)}>
      {data.map((d, i) => {
        const row = (
          <>
            <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">
              {i + 1}
            </span>
            <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-border/60">
              {d.imageUrl ? (
                <Image
                  src={d.imageUrl}
                  alt={d.label}
                  width={40}
                  height={40}
                  className="size-10 object-cover"
                />
              ) : (
                <PlaceholderImage
                  seed={d.id ?? d.label}
                  icon={Gem}
                  className="size-10"
                />
              )}
            </div>
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
          </>
        );

        const itemClassName = "flex items-center gap-3";
        return (
          <li key={d.id ?? d.label}>
            {d.href ? (
              <Link
                href={d.href}
                className={cn(
                  itemClassName,
                  "-mx-2 rounded-lg px-2 py-1 transition-colors hover:bg-secondary/40",
                )}
              >
                {row}
              </Link>
            ) : (
              <div className={itemClassName}>{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
