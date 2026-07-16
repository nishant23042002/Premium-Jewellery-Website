import { CircleCheck, Clock, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { t, type StorefrontDictionaryKey } from "@/lib/i18n/dictionary";
import type { Availability } from "@/features/products/product.types";
import type { Locale } from "@/types/common";

const AVAILABILITY_META: Record<
  Availability,
  {
    labelKey: StorefrontDictionaryKey;
    icon: typeof CircleCheck;
    variant: "success" | "outline" | "secondary";
  }
> = {
  in_showroom: {
    labelKey: "availableInShowroom",
    icon: CircleCheck,
    variant: "success",
  },
  made_to_order: {
    labelKey: "madeToOrder",
    icon: Clock,
    variant: "outline",
  },
  reserved: { labelKey: "reserved", icon: ShoppingBag, variant: "secondary" },
};

/**
 * Availability signal (Phase 5) — not real-time inventory (PRD v1 has none),
 * just an admin-set flag distinguishing ready stock from made-to-order or
 * already-reserved pieces. Rendered from both server pages and client
 * components (e.g. product-card.tsx), so locale is threaded as a prop
 * rather than fetched here — this file must stay import-safe from client
 * component trees.
 */
export function AvailabilityBadge({
  availability,
  locale = "en",
}: {
  availability: Availability;
  locale?: Locale;
}) {
  const meta = AVAILABILITY_META[availability];
  const Icon = meta.icon;

  return (
    <Badge variant={meta.variant} className="gap-1.5">
      <Icon className="size-3" />
      {t(meta.labelKey, locale)}
    </Badge>
  );
}
