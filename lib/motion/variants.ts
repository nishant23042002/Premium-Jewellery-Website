import type { Variants } from "motion/react";
import { DURATION, EASING } from "@/lib/motion/easings";

/**
 * Shared Motion variant presets (Phase 3 "Stagger animations", "Section
 * reveal animations"). Every variant animates only `opacity`/`transform`
 * (translate, scale) — never layout-affecting properties — so they stay
 * GPU-composited and don't trigger reflow.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASING.out },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASING.out },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.slow, ease: EASING.out },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.slow, ease: EASING.out },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.slow, ease: EASING.out },
  },
};

/** Parent container that staggers its children by `staggerChildren` seconds. */
export function staggerContainer(
  staggerChildren = 0.06,
  delayChildren = 0,
): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren, delayChildren },
    },
  };
}
