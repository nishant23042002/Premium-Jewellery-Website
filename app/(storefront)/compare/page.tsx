"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Scale, X } from "lucide-react";
import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/marketing/page-hero";
import { AvailabilityBadge } from "@/components/storefront/availability-badge";
import {
  getProductsByIds,
  type ProductWithPrice,
} from "@/features/products/product.actions";
import { useCompareStore } from "@/store/zustand/use-compare-store";
import { useMounted } from "@/hooks/use-mounted";
import { formatINR, formatWeight } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const ROWS: {
  label: string;
  render: (p: ProductWithPrice) => React.ReactNode;
}[] = [
  {
    label: "Price",
    render: (p) =>
      p.price.isRatePending ? "Price on request" : formatINR(p.price.total),
  },
  {
    label: "Availability",
    render: (p) => <AvailabilityBadge availability={p.product.availability} />,
  },
  {
    label: "Metal",
    render: (p) =>
      p.product.metalType[0].toUpperCase() + p.product.metalType.slice(1),
  },
  { label: "Purity", render: (p) => p.product.purity },
  {
    label: "Gross Weight",
    render: (p) => formatWeight(p.product.grossWeightGrams),
  },
  {
    label: "Net Weight",
    render: (p) => formatWeight(p.product.netWeightGrams),
  },
  {
    label: "Making Charge",
    render: (p) =>
      `${p.product.makingChargeValue}${p.product.makingChargeType === "percentage" ? "%" : ""}`,
  },
  { label: "SKU", render: (p) => p.product.skuCode },
];

/** Side-by-side spec comparison (Phase 5 "Comparison"), up to 4 products, local-storage-backed. */
export default function ComparePage() {
  const mounted = useMounted();
  const productIds = useCompareStore((s) => s.productIds);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const [items, setItems] = useState<ProductWithPrice[]>([]);

  useEffect(() => {
    if (!mounted || productIds.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    getProductsByIds(productIds).then((results) => {
      if (cancelled) return;
      const byId = new Map(results.map((r) => [r.product.id, r]));
      setItems(
        productIds
          .map((id) => byId.get(id))
          .filter((r): r is ProductWithPrice => !!r),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [mounted, productIds]);

  return (
    <>
      <PageHero
        eyebrow="Side by Side"
        title="Compare Pieces"
        description="Up to 4 pieces at a time, specs lined up for an easier decision."
        breadcrumbs={[{ label: "Compare" }]}
      />

      <section className="section pt-0">
        <Container>
          {!mounted || items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
              <Scale
                className="size-8 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="max-w-sm text-sm text-muted-foreground">
                Nothing to compare yet — use &ldquo;Add to Compare&rdquo; on any
                product card.
              </p>
              <Button
                variant="outline-gold"
                nativeButton={false}
                render={<Link href={ROUTES.products}>Browse Products</Link>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="mb-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clear}>
                  Clear all
                </Button>
              </div>
              <table className="w-full min-w-[560px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="w-32" />
                    {items.map(({ product }) => (
                      <th
                        key={product.id}
                        className="w-48 px-3 pb-4 text-left align-top"
                      >
                        <div className="relative">
                          <button
                            type="button"
                            aria-label={`Remove ${product.name.en} from comparison`}
                            onClick={() => remove(product.id)}
                            className="focus-luxury absolute top-1 right-1 z-10 flex size-6 items-center justify-center rounded-full bg-white/90"
                          >
                            <X className="size-3.5" />
                          </button>
                          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                            {product.images[0] && (
                              <Image
                                src={product.images[0].url}
                                alt={product.name.en}
                                fill
                                sizes="200px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <Link
                            href={ROUTES.product(product.slug)}
                            className="mt-2 block truncate text-sm font-medium hover:text-gold-dark"
                          >
                            {product.name.en}
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr
                      key={row.label}
                      className={cn(i % 2 === 0 && "bg-secondary/30")}
                    >
                      <th
                        scope="row"
                        className="p-3 text-left text-xs font-medium text-muted-foreground"
                      >
                        {row.label}
                      </th>
                      {items.map((item) => (
                        <td key={item.product.id} className="p-3 text-sm">
                          {row.render(item)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
