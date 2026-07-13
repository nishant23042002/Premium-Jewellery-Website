"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/skeletons/product-card-skeleton";
import { PageHero } from "@/components/marketing/page-hero";
import { ProductCard } from "@/components/storefront/product-card";
import {
  getProductsByIds,
  type ProductWithPrice,
} from "@/features/products/product.actions";
import { useWishlistStore } from "@/store/zustand/use-wishlist-store";
import { ROUTES } from "@/constants/routes";

/**
 * Wishlist view — backed by a per-customer DB record (`features/wishlist`),
 * so it persists across devices and logout/login rather than living only in
 * this browser's localStorage. Client-rendered because the in-memory store
 * is hydrated from the server in a layout-level effect (`WishlistHydrator`),
 * not fetched fresh on this page.
 */
export default function WishlistPage() {
  const hydrated = useWishlistStore((s) => s.hydrated);
  const productIds = useWishlistStore((s) => s.productIds);
  const [items, setItems] = useState<ProductWithPrice[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (productIds.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    getProductsByIds(productIds).then((results) => {
      if (!cancelled) setItems(results);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, productIds]);

  return (
    <>
      <PageHero
        eyebrow="Saved"
        title="Your Wishlist"
        description="Pieces you've saved for a closer look — tied to your account, ready on any device."
        breadcrumbs={[{ label: "Wishlist" }]}
      />

      <section className="section pt-0">
        <Container>
          {!hydrated || items === null ? (
            <ProductGridSkeleton count={4} />
          ) : items.length > 0 ? (
            <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap="lg">
              {items.map(({ product, price }) => (
                <ProductCard key={product.id} product={product} price={price} />
              ))}
            </Grid>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
              <Heart
                className="size-8 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="max-w-sm text-sm text-muted-foreground">
                Nothing saved yet — tap the heart on any piece to add it here.
              </p>
              <Button
                variant="outline-gold"
                nativeButton={false}
                render={<Link href={ROUTES.products}>Browse Products</Link>}
              />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
