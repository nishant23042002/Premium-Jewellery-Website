"use client";

import Link from "next/link";
import { ArrowUpRight, Gem } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { ImageReveal } from "@/components/motion/image-reveal";
import { MouseGlow } from "@/components/motion/mouse-glow";
import { CollectionCard } from "@/components/storefront/collection-card";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { t } from "@/lib/i18n/dictionary";
import type { Collection } from "@/features/collections/collection.types";
import type { Locale } from "@/types/common";

function BentoTile({
  collection,
  locale,
  large,
}: {
  collection: Collection;
  locale: Locale;
  large?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden",
        large ? "row-span-2" : "aspect-4/3",
      )}
    >
      <MouseGlow color="var(--gold-light)" className="absolute inset-0">
        <Link
          href={ROUTES.collection(collection.slug)}
          className="group block h-full w-full"
        >
          <ImageReveal className="absolute inset-0 rounded-xl">
            {collection.imageUrl ? (
              <ImageWithFallback
                src={collection.imageUrl}
                alt={collection.name[locale]}
                fill
                sizes={
                  large
                    ? "(min-width: 640px) 40vw, 50vw"
                    : "(min-width: 640px) 25vw, 50vw"
                }
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="gradient-gold-animated flex h-full w-full items-center justify-center">
                <Gem
                  className="size-8 text-gold-foreground/40"
                  strokeWidth={1}
                  aria-hidden
                />
              </div>
            )}
          </ImageReveal>

          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2 sm:inset-x-5 sm:bottom-5">
            <span
              className={cn(
                "font-heading text-white",
                large ? "text-xl sm:text-2xl" : "text-base sm:text-lg",
              )}
            >
              {collection.name[locale]}
            </span>
            <span
              className="flex size-7 shrink-0 translate-y-1 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
              aria-hidden
            >
              <ArrowUpRight className="size-3.5" />
            </span>
          </div>
        </Link>
      </MouseGlow>
    </motion.div>
  );
}

/**
 * Tanishq-style "1 tall + 2 stacked" bento layout for the homepage's
 * featured-collections section — the large tile spans both grid rows so it
 * always matches the combined height of the two smaller tiles + the gap
 * between them, with no fixed aspect ratio of its own. Needs exactly 3
 * collections; the caller falls back to the plain N-up Grid otherwise.
 */
export function CollectionBentoGrid({
  collections,
  locale = "en",
}: {
  collections: [Collection, Collection, Collection];
  locale?: Locale;
}) {
  const [primary, second, third] = collections;
  return (
    <>
      {/* Mobile only: the 2-col bento crams each tile into ~45vw, wrapping
          titles and shrinking images too far to read as "curated" — below
          sm it's replaced with a full-width swipeable rail. Desktop/tablet
          keep the untouched bento.

          Side padding is `(100% - card width) / 2` — matching the card's
          own `w-[78%]` — rather than a fixed px-4. With a fixed padding,
          only *interior* cards got a peek of a neighbor on both sides; the
          first/last card could only ever peek on one side, since
          scroll-snap can't overscroll past the content edge. Matching the
          padding to the leftover width means every snapped position,
          including the first and last card, always has that same reserved
          space on both sides — so it always reads as "one card centered,
          neighbors peeking," never a card flush against the screen edge. */}
      <div className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-[11%] pt-6 pb-1 sm:hidden [&::-webkit-scrollbar]:hidden">
        {collections.map((collection) => (
          <div key={collection.id} className="w-[78%] shrink-0 snap-center">
            <CollectionCard
              item={collection}
              href={ROUTES.collection(collection.slug)}
              locale={locale}
              eyebrow={t("collectionEyebrow", locale)}
            />
          </div>
        ))}
      </div>

      <div className="hidden grid-cols-2 grid-rows-2 gap-3 pt-6 sm:grid">
        <BentoTile collection={primary} locale={locale} large />
        <BentoTile collection={second} locale={locale} />
        <BentoTile collection={third} locale={locale} />
      </div>
    </>
  );
}
