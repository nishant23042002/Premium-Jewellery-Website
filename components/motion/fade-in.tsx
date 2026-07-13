"use client";

import { motion, useReducedMotion } from "motion/react";
import { DURATION, EASING } from "@/lib/motion/easings";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Simple on-mount fade — page-level content, modals, toasts.
 *
 * `initial.y` is never conditional on `shouldReduceMotion` — SSR can't see
 * `matchMedia`, so that would diverge the server-rendered transform from
 * the client's first paint and trip a hydration mismatch (see the note in
 * page-transition.tsx). Reduced motion is honored via `transition.duration`.
 */
export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : DURATION.base,
        ease: EASING.out,
        delay: shouldReduceMotion ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  );
}
