import { CircleCheck, Clock, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Availability } from "@/features/products/product.types";

const AVAILABILITY_META: Record<
  Availability,
  {
    label: string;
    icon: typeof CircleCheck;
    variant: "success" | "outline" | "secondary";
  }
> = {
  in_showroom: {
    label: "Available in Showroom",
    icon: CircleCheck,
    variant: "success",
  },
  made_to_order: { label: "Made to Order", icon: Clock, variant: "outline" },
  reserved: { label: "Reserved", icon: ShoppingBag, variant: "secondary" },
};

/**
 * Availability signal (Phase 5) — not real-time inventory (PRD v1 has none),
 * just an admin-set flag distinguishing ready stock from made-to-order or
 * already-reserved pieces.
 */
export function AvailabilityBadge({
  availability,
}: {
  availability: Availability;
}) {
  const meta = AVAILABILITY_META[availability];
  const Icon = meta.icon;

  return (
    <Badge variant={meta.variant} className="gap-1.5">
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  );
}
