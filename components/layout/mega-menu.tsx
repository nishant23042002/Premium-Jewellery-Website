"use client";

import Image from "next/image";
import Link from "next/link";
import { Gem } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { ROUTES } from "@/constants/routes";
import { DURATION, EASING } from "@/lib/motion/easings";
import type { Category } from "@/features/categories/category.types";
import type { Locale } from "@/types/common";

interface MegaMenuProps {
  open: boolean;
  categories: Category[];
  locale?: Locale;
  /** Immediate close — used for Escape and clicking a link. */
  onClose: () => void;
  /** Hover-intent handlers so moving from the trigger onto the panel cancels a pending close instead of the panel vanishing mid-transit. */
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/** Full-width collections preview panel, shown on hover/focus of the "Collections" nav item. */
export function MegaMenu({
  open,
  categories,
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
          aria-label="Collections"
          className="glass absolute inset-x-0 top-full z-40 border-b border-border shadow-lg"
        >
          <Container className="py-8">
            <Grid cols={{ base: 2, sm: 4 }} gap="lg">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={ROUTES.category(category.slug)}
                  onClick={onClose}
                  role="menuitem"
                  className="group rounded-sm focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <div className="relative aspect-4/3 overflow-hidden rounded-lg">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name[locale]}
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
                    {category.name[locale]}
                  </span>
                </Link>
              ))}
              {categories.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">
                  Collections will appear here once added in the admin panel.
                </p>
              )}
            </Grid>
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
