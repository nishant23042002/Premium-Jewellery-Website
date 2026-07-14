"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { ProductCard } from "@/components/storefront/product-card";
import {
  getProductsByIds,
  type ProductWithPrice,
} from "@/features/products/product.actions";
import { useRecentlyViewedStore } from "@/store/zustand/use-recently-viewed-store";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

/** "Recently Viewed" rail (Phase 5) — reads the local viewing history, excluding whichever product is currently open. */
export function RecentlyViewedRail({
  excludeProductId,
  locale = "en",
}: {
  excludeProductId?: string;
  locale?: Locale;
}) {
  const productIds = useRecentlyViewedStore((s) => s.productIds);
  const [items, setItems] = useState<ProductWithPrice[]>([]);

  useEffect(() => {
    const ids = productIds.filter((id) => id !== excludeProductId).slice(0, 4);
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    getProductsByIds(ids).then((results) => {
      if (!cancelled) {
        // Preserve most-recent-first order — getProductsByIds doesn't guarantee it.
        const byId = new Map(results.map((r) => [r.product.id, r]));
        setItems(
          ids
            .map((id) => byId.get(id))
            .filter((r): r is ProductWithPrice => !!r),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [productIds, excludeProductId]);

  if (items.length === 0) return null;

  return (
    <section className="section bg-secondary/20 pt-0">
      <Container>
        <h2 className="mb-8 font-heading text-2xl">
          {t("recentlyViewed", locale)}
        </h2>
        <Grid cols={{ base: 2, lg: 4 }} gap="lg">
          {items.map(({ product, price }) => (
            <ProductCard
              key={product.id}
              product={product}
              price={price}
              locale={locale}
            />
          ))}
        </Grid>
      </Container>
    </section>
  );
}
