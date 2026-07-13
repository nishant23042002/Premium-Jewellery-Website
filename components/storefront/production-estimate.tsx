import { Clock, Truck } from "lucide-react";
import type { DayRange } from "@/features/products/product.types";

interface ProductionEstimateProps {
  productionTimeDays?: DayRange;
  deliveryEstimateDays?: DayRange;
  dispatchNote?: string;
  /** Compact = small inline text for product cards. Full = the detailed block for the Product Detail Page. */
  compact?: boolean;
}

function formatRange(range?: DayRange): string | null {
  if (!range) return null;
  if (range.min === range.max) return `${range.min} Days`;
  return `${range.min}–${range.max} Days`;
}

/**
 * "Crafted On Order" messaging for Made-to-Order products — deliberately
 * never renders alongside stock-style copy ("In Stock", "Only N Left"),
 * which doesn't apply to a piece that's made after the order is placed.
 */
export function ProductionEstimate({
  productionTimeDays,
  deliveryEstimateDays,
  dispatchNote,
  compact = false,
}: ProductionEstimateProps) {
  const production = formatRange(productionTimeDays);
  const delivery = formatRange(deliveryEstimateDays);

  if (compact) {
    if (!production && !delivery) return null;
    return (
      <p className="text-xs text-muted-foreground">
        {production && <>Production: {production}</>}
        {production && delivery && " · "}
        {delivery && <>Delivery: {delivery}</>}
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-4 text-sm">
      <p className="font-medium text-foreground">Crafted On Order</p>
      <p className="text-muted-foreground">
        This piece is handcrafted only after your order is confirmed.
      </p>
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <p className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
            <Clock className="size-3.5" /> Production Time
          </p>
          <p className="mt-0.5 font-medium">
            {production ?? "To be confirmed"}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
            <Truck className="size-3.5" /> Estimated Delivery
          </p>
          <p className="mt-0.5 font-medium">
            {delivery ? `${delivery} after dispatch` : "To be confirmed"}
          </p>
        </div>
      </div>
      {dispatchNote && (
        <p className="text-xs text-muted-foreground">{dispatchNote}</p>
      )}
    </div>
  );
}
