"use client";

import Link from "next/link";
import { Heart, Scale } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { Magnetic } from "@/components/motion/magnetic-button";
import { MouseGlow } from "@/components/motion/mouse-glow";
import { AvailabilityBadge } from "@/components/storefront/availability-badge";
import { LowStockBadge } from "@/components/storefront/low-stock-badge";
import { ProductionEstimate } from "@/components/storefront/production-estimate";
import { ProductQuickView } from "@/components/storefront/product-quick-view";
import {
  isMadeToOrder,
  isNewArrival,
  LOW_STOCK_THRESHOLD,
} from "@/features/products/product.types";
import { ROUTES } from "@/constants/routes";
import { formatINR } from "@/lib/utils/format";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { t } from "@/lib/i18n/dictionary";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/store/zustand/use-wishlist-store";
import { useCompareStore } from "@/store/zustand/use-compare-store";
import type { Locale } from "@/types/common";
import type {
  PriceBreakdown,
  Product,
} from "@/features/products/product.types";

interface ProductCardProps {
  product: Product;
  price: PriceBreakdown;
  locale?: Locale;
  className?: string;
  /** Computed catalogue-wide signals — batch-looked-up by the listing page, never queried per-card. */
  isBestSeller?: boolean;
  isTrending?: boolean;
}

/**
 * Catalogue grid card — image, name, live calculated price, shortlist
 * toggle (PRD §13, §21, §24). Hover/tap states are a subtle lift, never a
 * color inversion (Phase 2 "Hover States").
 */
export function ProductCard({
  product,
  price,
  locale = "en",
  className,
  isBestSeller = false,
  isTrending = false,
}: ProductCardProps) {
  const isShortlisted = useWishlistStore((s) => s.has(product.id));
  const toggleShortlist = useWishlistStore((s) => s.toggle);
  const isComparing = useCompareStore((s) => s.has(product.id));
  const compareAdd = useCompareStore((s) => s.add);
  const compareRemove = useCompareStore((s) => s.remove);

  function handleCompareToggle(e: React.MouseEvent) {
    e.preventDefault();
    if (isComparing) {
      compareRemove(product.id);
      return;
    }
    const added = compareAdd(product.id);
    if (!added) {
      toast.error(
        "Comparison list is full",
        "Remove a piece before adding another (max 4).",
      );
    }
  }

  const coverImage = product.images[0];
  const hoverImage = product.images[1];
  const displayName = pickLocalized(product.name, locale);

  // A card only ever shows one promotional badge — stacking Best Seller +
  // Trending + New + Featured reads as noise. Priority favors the stronger
  // buying-intent signal first.
  const promoBadge = isBestSeller
    ? t("bestSeller", locale)
    : isTrending
      ? t("trending", locale)
      : isNewArrival(product)
        ? t("newArrival", locale)
        : product.isFeatured
          ? t("featured", locale)
          : null;

  return (
    <motion.div
      className={cn("group relative", className)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={ROUTES.product(product.slug)} className="block">
        <MouseGlow
          color="var(--gold-light)"
          className="aspect-square overflow-hidden rounded-t-lg bg-muted shadow-sm transition-shadow duration-300 group-hover:shadow-md max-[500px]:aspect-4/6"
        >
          <ProductQuickView product={product} price={price} locale={locale} />
          {coverImage ? (
            <>
              <ImageWithFallback
                src={coverImage.url}
                alt={coverImage.altText?.[locale] || displayName}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className={cn(
                  "object-cover transition-[transform,opacity] duration-500 ease-out group-hover:scale-105",
                  hoverImage && "group-hover:opacity-0",
                )}
              />
              {/* Product hover effect (Phase 3): crossfade to a second angle
                  on hover, the common jewellery-catalogue pattern. Both
                  images are pre-laid-out via `fill`, so the swap is
                  opacity-only — no layout shift. */}
              {hoverImage && (
                <ImageWithFallback
                  src={hoverImage.url}
                  alt={hoverImage.altText?.[locale] || displayName}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {t("noImageYet", locale)}
            </div>
          )}

          <div className="absolute bottom-0 flex w-full flex-col">
            {promoBadge && <Badge variant="gold">{promoBadge}</Badge>}
            {product.availability !== "in_showroom" && (
              <AvailabilityBadge
                availability={product.availability}
                locale={locale}
              />
            )}
            {/* Never mix stock-style urgency messaging with a made-to-order piece — it isn't "in stock" at all, it's crafted after ordering. */}
            {!isMadeToOrder(product) &&
              product.quantity > 0 &&
              product.quantity <= LOW_STOCK_THRESHOLD && (
                <LowStockBadge quantity={product.quantity} locale={locale} />
              )}
          </div>

          <div className="absolute top-3 right-3 flex gap-3">
            <Magnetic strength={0.4}>
              <button
                type="button"
                aria-label={
                  isShortlisted ? "Remove from shortlist" : "Add to shortlist"
                }
                aria-pressed={isShortlisted}
                onClick={(e) => {
                  e.preventDefault();
                  toggleShortlist(product.id);
                }}
                className="flex size-5 items-center justify-center rounded-full transition-colors hover:bg-white"
              >
                <Heart
                  className={cn(
                    "size-5 transition-colors",
                    isShortlisted ? "fill-primary text-white" : "text-white/80",
                  )}
                />
              </button>
            </Magnetic>
            <Magnetic strength={0.4}>
              <button
                type="button"
                aria-label={
                  isComparing ? "Remove from compare" : "Add to compare"
                }
                aria-pressed={isComparing}
                onClick={handleCompareToggle}
                className="flex size-5 items-center justify-center rounded-full transition-colors hover:bg-white"
              >
                <Scale
                  className={cn(
                    "size-5 transition-colors",
                    isComparing ? "text-gold-dark" : "text-white/80",
                  )}
                />
              </button>
            </Magnetic>
          </div>
        </MouseGlow>

        <div className="mt-1 space-y-1">
          <h3 className="truncate font-heading text-base">{displayName}</h3>
          <p className="text-xs text-muted-foreground">
            {product.purity} {product.metalType}
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {price.isRatePending
              ? t("priceOnRequest", locale)
              : formatINR(price.total)}
          </p>
          {isMadeToOrder(product) && (
            <ProductionEstimate
              productionTimeDays={product.productionTimeDays}
              deliveryEstimateDays={product.deliveryEstimateDays}
              compact
              locale={locale}
            />
          )}
        </div>
      </Link>
    </motion.div>
  );
}
