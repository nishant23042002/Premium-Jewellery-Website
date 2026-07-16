import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Locale, LocalizedText } from "@/types/common";

const LOW_STOCK_COPY: { only: LocalizedText; left: LocalizedText } = {
  only: { en: "Only", hi: "केवल", mr: "फक्त" },
  left: { en: "left", hi: "बचे हैं", mr: "शिल्लक" },
};

/** Shown only when 0 < quantity <= LOW_STOCK_THRESHOLD — zero stock isn't "low", it's out, and is a separate concern from this badge. */
export function LowStockBadge({
  quantity,
  locale = "en",
}: {
  quantity: number;
  locale?: Locale;
}) {
  return (
    <Badge variant="destructive" className="gap-1.5">
      <Flame className="size-3" />
      {LOW_STOCK_COPY.only[locale]} {quantity} {LOW_STOCK_COPY.left[locale]}
    </Badge>
  );
}
