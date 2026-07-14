"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";
import { listProducts, type ProductWithPrice, type ListProductsParams } from "@/features/products/product.actions";
import type { Locale } from "@/types/common";

/**
 * Infinite-scroll-lite alternative to page-based navigation (PRD asked for
 * both): appends the next page's cards inline instead of replacing the URL,
 * so a shopper can keep scrolling without a round trip through Prev/Next.
 * Deliberately click-triggered rather than an IntersectionObserver
 * auto-loader — simpler, and avoids surprise data usage on mobile.
 */
export function ProductLoadMore({
  baseParams,
  startPage,
  totalPages,
  bestSellerIds,
  trendingIds,
  locale = "en",
}: {
  baseParams: Omit<ListProductsParams, "page">;
  startPage: number;
  totalPages: number;
  bestSellerIds: string[];
  trendingIds: string[];
  locale?: Locale;
}) {
  const [items, setItems] = useState<ProductWithPrice[]>([]);
  const [nextPage, setNextPage] = useState(startPage + 1);
  const [isPending, startTransition] = useTransition();
  const bestSellerSet = new Set(bestSellerIds);
  const trendingSet = new Set(trendingIds);

  if (nextPage > totalPages && items.length === 0) return null;

  function loadMore() {
    startTransition(async () => {
      const result = await listProducts({ ...baseParams, page: nextPage, pageSize: 24 });
      setItems((prev) => [...prev, ...result.items]);
      setNextPage((p) => p + 1);
    });
  }

  return (
    <div className="mt-8">
      {items.length > 0 && (
        <Grid cols={{ base: 2, sm: 3, xl: 4 }} gap="lg" className="mb-8">
          {items.map(({ product, price }) => (
            <ProductCard
              key={product.id}
              product={product}
              price={price}
              locale={locale}
              isBestSeller={bestSellerSet.has(product.id)}
              isTrending={trendingSet.has(product.id)}
            />
          ))}
        </Grid>
      )}

      {nextPage <= totalPages && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
