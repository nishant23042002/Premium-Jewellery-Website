"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DURATION, EASING } from "@/lib/motion/easings";
import { useCompareStore } from "@/store/zustand/use-compare-store";
import { ROUTES } from "@/constants/routes";

/**
 * Site-wide floating comparison tray (Phase 5 "Comparison") — persists
 * across navigation since it's backed by the same localStorage store
 * everywhere, matching the common "add to compare while browsing" pattern.
 */
export function CompareBar() {
  const productIds = useCompareStore((s) => s.productIds);
  const clear = useCompareStore((s) => s.clear);

  return (
    <AnimatePresence>
      {productIds.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: DURATION.base, ease: EASING.out }}
          className="glass fixed inset-x-4 bottom-20 z-30 flex items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-lg lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-80"
        >
          <div className="flex items-center gap-2 text-sm">
            <Scale className="size-4 text-gold" />
            <span className="font-medium">{productIds.length} to compare</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="gold"
              nativeButton={false}
              render={<Link href={ROUTES.compare}>Compare</Link>}
            />
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Clear comparison"
              onClick={clear}
            >
              <X className="size-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
