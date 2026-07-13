"use client";

import { motion, useReducedMotion, useTransform } from "motion/react";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { cn } from "@/lib/utils";

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  /** Px of vertical travel across the element's scroll-through range. Negative = moves up. */
  offset?: number;
}

/**
 * Scroll-linked vertical drift (Phase 3 "Parallax"). Uses
 * `transform: translateY()` only — driven by scroll progress via
 * `useTransform`, so it's a compositor-only update on every scroll frame,
 * never a layout recalculation.
 */
export function Parallax({ children, className, offset = -60 }: ParallaxProps) {
  const { ref, progress } = useScrollProgress();
  const shouldReduceMotion = useReducedMotion();
  const y = useTransform(progress, [0, 1], [0, offset]);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ y: shouldReduceMotion ? 0 : y }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
