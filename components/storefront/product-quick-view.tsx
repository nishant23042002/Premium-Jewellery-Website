"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceBreakdown } from "@/components/storefront/price-breakdown";
import { ReserveButton } from "@/components/storefront/reserve-button";
import { AvailabilityBadge } from "@/components/storefront/availability-badge";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { t } from "@/lib/i18n/dictionary";
import { ROUTES } from "@/constants/routes";
import type { Locale } from "@/types/common";
import type {
  PriceBreakdown as PriceBreakdownType,
  Product,
} from "@/features/products/product.types";

/**
 * Hover-triggered "Quick View" — lets a shopper check price/availability
 * without leaving the grid. Deliberately lighter than the full PDP (no
 * gallery, no spec table, no nested enquiry dialog) — "View Full Details"
 * is one click away for anyone who wants the complete page.
 */
export function ProductQuickView({
  product,
  price,
  locale = "en",
}: {
  product: Product;
  price: PriceBreakdownType;
  locale?: Locale;
}) {
  const [open, setOpen] = useState(false);
  const displayName = pickLocalized(product.name, locale);
  const coverImage = product.images[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Quick view ${displayName}`}
            onClick={(e) => {
              // This sits inside the card's outer <Link> — without stopping
              // propagation, opening the dialog would also navigate to the PDP.
              e.preventDefault();
              e.stopPropagation();
            }}
            className="focus-luxury absolute top-3 left-3 z-10 hidden size-8 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:flex"
          >
            <Eye className="size-4" />
          </button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">{displayName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {coverImage && (
              <ImageWithFallback
                src={coverImage.url}
                alt={coverImage.altText?.[locale] || displayName}
                fill
                sizes="(min-width: 640px) 320px, 90vw"
                className="object-cover"
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {product.isFeatured && (
                <Badge variant="gold">{t("featured", locale)}</Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {product.metalType}
              </Badge>
              <AvailabilityBadge availability={product.availability} locale={locale} />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("skuLabel", locale)} {product.skuCode}
            </p>
            <PriceBreakdown price={price} locale={locale} />
            <div className="mt-auto space-y-2 pt-2">
              <ReserveButton productSlug={product.slug} locale={locale} />
              <Button
                variant="outline"
                className="w-full"
                nativeButton={false}
                render={
                  <Link href={ROUTES.product(product.slug)} onClick={() => setOpen(false)}>
                    {t("viewFullDetails", locale)}
                  </Link>
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
