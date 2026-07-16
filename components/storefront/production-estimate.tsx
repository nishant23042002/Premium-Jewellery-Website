import { Clock, Truck } from "lucide-react";
import type { DayRange } from "@/features/products/product.types";
import type { Locale, LocalizedText } from "@/types/common";

interface ProductionEstimateProps {
  productionTimeDays?: DayRange;
  deliveryEstimateDays?: DayRange;
  dispatchNote?: string;
  /** Compact = small inline text for product cards. Full = the detailed block for the Product Detail Page. */
  compact?: boolean;
  locale?: Locale;
}

/** Page/component-local copy — too specific to this component to belong in the shared dictionary. */
const COPY: Record<string, LocalizedText> = {
  production: { en: "Production", hi: "उत्पादन", mr: "उत्पादन" },
  delivery: { en: "Delivery", hi: "डिलीवरी", mr: "डिलिव्हरी" },
  days: { en: "Days", hi: "दिन", mr: "दिवस" },
  craftedOnOrder: { en: "Crafted On Order", hi: "ऑर्डर पर तैयार", mr: "ऑर्डरनुसार तयार" },
  craftedOnOrderDesc: {
    en: "This piece is handcrafted only after your order is confirmed.",
    hi: "यह आभूषण आपके ऑर्डर की पुष्टि होने के बाद ही हस्तनिर्मित किया जाता है।",
    mr: "हा दागिना तुमची ऑर्डर निश्चित झाल्यावरच हाताने बनवला जातो.",
  },
  productionTime: { en: "Production Time", hi: "उत्पादन समय", mr: "उत्पादन वेळ" },
  estimatedDelivery: {
    en: "Estimated Delivery",
    hi: "अनुमानित डिलीवरी",
    mr: "अंदाजित डिलिव्हरी",
  },
  toBeConfirmed: { en: "To be confirmed", hi: "पुष्टि होना बाकी", mr: "पुष्टी होणे बाकी" },
  afterDispatch: { en: "after dispatch", hi: "डिस्पैच के बाद", mr: "डिस्पॅचनंतर" },
};

function formatRange(range: DayRange | undefined, locale: Locale): string | null {
  if (!range) return null;
  const days = COPY.days[locale];
  if (range.min === range.max) return `${range.min} ${days}`;
  return `${range.min}–${range.max} ${days}`;
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
  locale = "en",
}: ProductionEstimateProps) {
  const production = formatRange(productionTimeDays, locale);
  const delivery = formatRange(deliveryEstimateDays, locale);

  if (compact) {
    if (!production && !delivery) return null;
    return (
      <p className="text-xs text-muted-foreground">
        {production && (
          <>
            {COPY.production[locale]}: {production}
          </>
        )}
        {production && delivery && " · "}
        {delivery && (
          <>
            {COPY.delivery[locale]}: {delivery}
          </>
        )}
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-4 text-sm">
      <p className="font-medium text-foreground">{COPY.craftedOnOrder[locale]}</p>
      <p className="text-muted-foreground">{COPY.craftedOnOrderDesc[locale]}</p>
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <p className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
            <Clock className="size-3.5" /> {COPY.productionTime[locale]}
          </p>
          <p className="mt-0.5 font-medium">
            {production ?? COPY.toBeConfirmed[locale]}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
            <Truck className="size-3.5" /> {COPY.estimatedDelivery[locale]}
          </p>
          <p className="mt-0.5 font-medium">
            {delivery
              ? `${delivery} ${COPY.afterDispatch[locale]}`
              : COPY.toBeConfirmed[locale]}
          </p>
        </div>
      </div>
      {dispatchNote && (
        <p className="text-xs text-muted-foreground">{dispatchNote}</p>
      )}
    </div>
  );
}
