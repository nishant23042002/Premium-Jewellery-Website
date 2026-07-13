"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DURATION, EASING } from "@/lib/motion/easings";
import { SITE } from "@/constants/site";

interface PagePreloaderProps {
  /** Minimum time the preloader stays up, so it never flashes on fast connections. */
  minDurationMs?: number;
}

/**
 * Full-screen branded loading experience for the initial app load (Phase 3
 * "Loading experience") — wordmark + a gold line that draws in, then the
 * whole overlay fades out. Distinct from `<Loader>` (small inline spinner
 * used for in-page async states) and from `loading.tsx` (Suspense
 * fallback for route segments) — this is a one-time cold-start moment.
 *
 * Not mounted globally by default; add to `app/layout.tsx` once real page
 * content exists; wrapping the current scaffold `app/page.tsx` would just
 * add a delay in front of the Next.js boilerplate.
 */
export function PagePreloader({ minDurationMs = 900 }: PagePreloaderProps) {
  const [visible, setVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(false), minDurationMs);
    return () => clearTimeout(timer);
  }, [minDurationMs, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-label="Loading"
          className="fixed inset-0 z-100 flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.slower, ease: EASING.inOut }}
        >
          <div className="flex flex-col items-center gap-4">
            <motion.p
              className="font-heading text-2xl tracking-wide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.slow, ease: EASING.out }}
            >
              {SITE.name}
            </motion.p>
            <motion.span
              className="h-px w-24 origin-left bg-gold"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: EASING.inOut, delay: 0.15 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
