import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface GrowthBadgeProps {
  /** Percent change vs. the prior comparable period — null when there's nothing to compare against yet. */
  percent: number | null;
  className?: string;
}

/** Small colored delta pill — encodes direction (up/down/flat) as both color and icon, not color alone. */
export function GrowthBadge({ percent, className }: GrowthBadgeProps) {
  if (percent === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground",
          className,
        )}
      >
        New
      </span>
    );
  }

  const isFlat = percent === 0;
  const isUp = percent > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums",
        isFlat
          ? "bg-muted text-muted-foreground"
          : isUp
            ? "bg-success/10 text-success"
            : "bg-destructive/10 text-destructive",
        className,
      )}
    >
      {isFlat ? (
        <Minus className="size-2.5" />
      ) : isUp ? (
        <TrendingUp className="size-2.5" />
      ) : (
        <TrendingDown className="size-2.5" />
      )}
      {isUp && "+"}
      {percent}%
    </span>
  );
}
