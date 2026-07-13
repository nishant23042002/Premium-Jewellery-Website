"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { DURATION, EASING } from "@/lib/motion/easings";
import { cn } from "@/lib/utils";

interface ImageRevealProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Clip-path wipe-in for product/hero photography (Phase 3 "Image reveal
 * animations") — the image is already laid out (no CLS, since the wrapper
 * keeps the image's natural box), just progressively unmasked via
 * `clip-path`, which is compositor-accelerated and never triggers layout.
 * Wrap a `next/image` (with `fill` + a sized parent) as the child. Doesn't
 * impose `position` itself (only `overflow-hidden`) — pass `relative` in
 * `className` when this is the sized box, or `absolute inset-0` when it's
 * a fill layer inside an already-positioned parent, so the two never
 * fight over the same CSS property.
 *
 * `initial`/`whileInView`/`variants` are always set (never `undefined`) —
 * `useReducedMotion()` reads `matchMedia`, which SSR can't see, so
 * branching the PROP SHAPE itself on it (as this used to) makes the
 * server-rendered markup structurally diverge from the client's first
 * paint: React logs a hydration mismatch and, worse, if the client resolves
 * to the `undefined` branch after the server already committed the
 * `"hidden"`/clip-path-masked branch, the image can be left permanently
 * clipped since nothing ever transitions it to `"visible"`. Reduced motion
 * is honored via `transition.duration` instead, which isn't part of the
 * rendered attributes.
 */
const clipRevealInstant: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  visible: { clipPath: "inset(0 0 0% 0)", transition: { duration: 0 } },
};

const clipRevealAnimated: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  visible: {
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: DURATION.slower, ease: EASING.inOut },
  },
};

export function ImageReveal({ children, className }: ImageRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={shouldReduceMotion ? clipRevealInstant : clipRevealAnimated}
    >
      {children}
    </motion.div>
  );
}
