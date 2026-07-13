import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import type { OrderItem } from "@/features/orders/order.types";

/** A single line item within an order — image, name (linked back to the product), quantity, and price. Shared across the order confirmation, customer order detail, and any other surface that lists what was ordered. */
export function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href={ROUTES.product(item.slug)}
        className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        {item.imageUrl && (
          <Image
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
          Qty {item.quantity}
          {item.skuCode && ` · SKU ${item.skuCode}`}
          {item.isMadeToOrder && (
            <span className="text-gold-dark"> · Made to Order</span>
          )}
        </p>
      </div>
      <span className="shrink-0 font-medium">
        {formatINR(item.unitPrice * item.quantity)}
      </span>
    </div>
  );
}
