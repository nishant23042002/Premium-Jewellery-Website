"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import { EASING } from "@/lib/motion/easings";

/**
 * Luxury scroll behavior (PRD §15/§25/Phase 2 "Luxury Scroll Behavior") —
 * a slightly weighted, velvet-tray feel rather than the default abrupt
 * native scroll. Respects prefers-reduced-motion by falling back to
 * effectively-native scrolling (no lerp smoothing, no eased duration).
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ReactLenis
      root
      options={
        shouldReduceMotion
          ? { lerp: 1, duration: 0, smoothWheel: false, syncTouch: false }
          : {
              lerp: 0.1,
              duration: 1.1,
              easing: EASING.lenis,
              smoothWheel: true,
              syncTouch: false,
            }
      }
    >
      {children}
    </ReactLenis>
  );
}
