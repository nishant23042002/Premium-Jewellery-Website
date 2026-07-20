import Link from "next/link";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { formatINR } from "@/lib/utils/format";
import { t } from "@/lib/i18n/dictionary";
import { ROUTES } from "@/constants/routes";
import type { Locale, LocalizedText } from "@/types/common";
import type { OrderItem } from "@/features/orders/order.types";

const COPY: { qty: LocalizedText; sku: LocalizedText } = {
  qty: { en: "Qty", hi: "मात्रा", mr: "प्रमाण" },
  sku: { en: "SKU", hi: "SKU", mr: "SKU" },
};

/** A single line item within an order — image, name (linked back to the product), quantity, and price. Shared across the order confirmation, customer order detail, and any other surface that lists what was ordered. */
export function OrderItemRow({
  item,
  locale = "en",
}: {
  item: OrderItem;
  locale?: Locale;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href={ROUTES.product(item.slug)}
        className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        {item.imageUrl && (
          <ImageWithFallback
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={ROUTES.product(item.slug)}
          className="block truncate font-medium hover:text-gold-dark"
        >
          {item.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {COPY.qty[locale]} {item.quantity}
          {item.skuCode && ` · ${COPY.sku[locale]} ${item.skuCode}`}
          {item.isMadeToOrder && (
            <span className="text-gold-dark"> · {t("madeToOrder", locale)}</span>
          )}
        </p>
      </div>
      <span className="shrink-0 font-medium">
        {formatINR(item.unitPrice * item.quantity)}
      </span>
    </div>
  );
}
