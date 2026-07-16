"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";

/**
 * Luxury scroll behavior (PRD §15/§25/Phase 2 "Luxury Scroll Behavior") —
 * a slightly weighted, velvet-tray feel rather than the default abrupt
 * native scroll. Respects prefers-reduced-motion by falling back to
 * effectively-native scrolling (no lerp smoothing, no eased duration).
 *
 * Deliberately `lerp`-only (no `duration`/`easing`) — Lenis's Animate class
 * prefers duration+easing over lerp whenever both are set (see
 * node_modules/lenis/dist/lenis.mjs), so the previous config's `duration:
 * 1.1` silently overrode `lerp: 0.1` on every wheel/touch event. That mode
 * restarts a ~1.1s eased animation on each scroll input, which visibly
 * lags behind fast or repeated scrolling — the "jerky/laggy" feel reported.
 * Frame-by-frame lerp damping tracks the input far more tightly instead.
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
          ? { lerp: 1, smoothWheel: false, syncTouch: false }
          : {
              lerp: 0.14,
              smoothWheel: true,
              syncTouch: false,
            }
      }
    >
      {children}
    </ReactLenis>
  );
}
