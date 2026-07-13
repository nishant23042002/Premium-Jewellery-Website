"use client";

import { useCallback, useRef } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

export interface MousePositionResult {
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** 0–1 normalized position within the element, for gradient/glow placement. */
  xPct: MotionValue<number>;
  yPct: MotionValue<number>;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerLeave: () => void;
}

/**
 * Tracks pointer position relative to an element as Motion values (not
 * React state) — updates never trigger a re-render, only a compositor
 * update, which is how MagneticButton/MouseGlow/TiltCard stay at 60fps.
 */
export function useMousePosition(): MousePositionResult {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xPct = useMotionValue(0.5);
  const yPct = useMotionValue(0.5);
  const rectRef = useRef<DOMRect | null>(null);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const rect =
        rectRef.current ?? event.currentTarget.getBoundingClientRect();
      rectRef.current = rect;

      const relX = event.clientX - rect.left;
      const relY = event.clientY - rect.top;

      x.set(relX - rect.width / 2);
      y.set(relY - rect.height / 2);
      xPct.set(relX / rect.width);
      yPct.set(relY / rect.height);
    },
    [x, y, xPct, yPct],
  );

  const onPointerLeave = useCallback(() => {
    rectRef.current = null;
    x.set(0);
    y.set(0);
    xPct.set(0.5);
    yPct.set(0.5);
  }, [x, y, xPct, yPct]);

  return { x, y, xPct, yPct, onPointerMove, onPointerLeave };
}
