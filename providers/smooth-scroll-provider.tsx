"use client";

import { ReactLenis } from "lenis/react";
import { EASING } from "@/lib/motion/easings";

/**
 * Luxury scroll behavior (PRD §15/§25/Phase 2 "Luxury Scroll Behavior") —
 * a slightly weighted, velvet-tray feel rather than the default abrupt
 * native scroll. Respects prefers-reduced-motion by disabling easing.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.1,
        easing: EASING.lenis,
        smoothWheel: true,
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
