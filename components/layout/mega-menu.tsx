"use client";

import Image from "next/image";
import Link from "next/link";
import { Gem } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { DURATION, EASING } from "@/lib/motion/easings";
import type { LocalizedText, Locale } from "@/types/common";

export interface MegaMenuItem {
  id: string;
  slug: string;
  name: LocalizedText;
  imageUrl?: string;
}

interface MegaMenuProps {
  open: boolean;
  items: MegaMenuItem[];
  hrefBuilder: (slug: string) => string;
  ariaLabel: string;
  emptyMessage: string;
  locale?: Locale;
  /** Immediate close — used for Escape and clicking a link. */
  onClose: () => void;
  /** Hover-intent handlers so moving from the trigger onto the panel cancels a pending close instead of the panel vanishing mid-transit. */
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/** Full-width preview panel shown on hover/focus of a nav item — driven entirely by `items`/`hrefBuilder` so the same panel serves both "Collections" (curated editorial groupings) and "Categories" (taxonomic classification) without conflating the two. */
export function MegaMenu({
  open,
  items,
  hrefBuilder,
  ariaLabel,
  emptyMessage,
  locale = "en",
  onClose,
  onMouseEnter,
  onMouseLeave,
}: MegaMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: DURATION.base, ease: EASING.out }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
          role="menu"
          aria-label={ariaLabel}
          className="glass absolute inset-x-0 top-full z-40 border-b border-border shadow-lg"
        >
          <Container className="py-8">
            <Grid cols={{ base: 2, sm: 4 }} gap="lg">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={hrefBuilder(item.slug)}
                  onClick={onClose}
                  role="menuitem"
                  className="group rounded-sm focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <div className="relative aspect-4/3 overflow-hidden rounded-lg">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name[locale]}
                        fill
                        sizes="(min-width: 1024px) 20vw, 40vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="gradient-gold-animated flex h-full w-full items-center justify-center">
                        <Gem
                          className="size-6 text-gold-foreground/40"
                          strokeWidth={1}
                          aria-hidden
                        />
                      </div>
                    )}
                  </div>
                  <span className="mt-2 block text-sm transition-colors group-hover:text-gold-dark">
                    {item.name[locale]}
                  </span>
                </Link>
              ))}
              {items.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">
                  {emptyMessage}
                </p>
              )}
            </Grid>
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
