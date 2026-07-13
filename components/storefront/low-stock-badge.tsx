import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Shown only when 0 < quantity <= LOW_STOCK_THRESHOLD — zero stock isn't "low", it's out, and is a separate concern from this badge. */
export function LowStockBadge({ quantity }: { quantity: number }) {
  return (
    <Badge variant="destructive" className="gap-1.5">
      <Flame className="size-3" />
      Only {quantity} left
    </Badge>
  );
}
