"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Gem } from "lucide-react";
import { motion } from "motion/react";
import { ImageReveal } from "@/components/motion/image-reveal";
import { MouseGlow } from "@/components/motion/mouse-glow";
import { cn } from "@/lib/utils";
import type { LocalizedText, Locale } from "@/types/common";

interface CollectionCardProps {
  item: {
    slug: string;
    name: LocalizedText;
    imageUrl?: string;
    description?: Partial<LocalizedText>;
  };
  href: string;
  locale?: Locale;
  className?: string;
  /** Small uppercase label above the title — e.g. "Collection" vs "Category". Purely presentational. */
  eyebrow?: string;
}

/**
 * Editorial-style tile — full-bleed image, name overlaid (PRD §13, §29).
 * Entrance uses a clip-path wipe (Phase 3 "Collection transitions" /
 * "Image reveal animations"); hover adds a cursor-tracked glow on top of
 * the existing lift + zoom (Phase 3 "Mouse lighting"). Shared between
 * Category tiles and Collection tiles — the caller supplies the target
 * `href` so this stays agnostic of which entity it's rendering.
 */
export function CollectionCard({
  item,
  href,
  locale = "en",
  className,
  eyebrow,
}: CollectionCardProps) {
  const description = item.description?.[locale];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <MouseGlow
        color="var(--gold-light)"
        className={cn(
          "block aspect-4/5 overflow-hidden rounded-2xl shadow-sm",
          className,
        )}
      >
        <Link href={href} className="group block h-full w-full">
          <ImageReveal className="absolute inset-0">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name[locale]}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="gradient-gold-animated flex h-full w-full items-center justify-center">
                <Gem
                  className="size-10 text-gold-foreground/40"
                  strokeWidth={1}
                  aria-hidden
                />
              </div>
            )}
          </ImageReveal>

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

          <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
            <div>
              {eyebrow && (
                <p className="mb-1.5 text-[0.65rem] font-medium tracking-[0.22em] text-white/70 uppercase">
                  {eyebrow}
                </p>
              )}
              <span className="font-heading text-xl text-white">
                {item.name[locale]}
              </span>
              {description && (
                <p className="mt-1 max-w-[85%] truncate text-xs text-white/70">
                  {description}
                </p>
              )}
            </div>
            <span
              className="flex size-8 shrink-0 translate-y-1 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
              aria-hidden
            >
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </Link>
      </MouseGlow>
    </motion.div>
  );
}
