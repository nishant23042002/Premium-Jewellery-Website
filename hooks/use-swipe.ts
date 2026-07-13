"use client";

import { useRef } from "react";

export interface SwipeHandlers {
  onLeft?: () => void;
  onRight?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  /** Minimum travel in px before a gesture counts as a swipe. */
  threshold?: number;
}

export interface SwipeListeners {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Lightweight touch-swipe detection (Phase 3 "Mobile gestures") — plain
 * pointer/touch math, no gesture library needed for a simple 4-direction
 * dismiss/navigate pattern (mobile nav close, gallery advance, shortlist
 * drawer dismiss).
 */
export function useSwipe({
  onLeft,
  onRight,
  onUp,
  onDown,
  threshold = 50,
}: SwipeHandlers): SwipeListeners {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!start.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.current.x;
    const dy = touch.clientY - start.current.y;
    start.current = null;

    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) onRight?.();
      else onLeft?.();
    } else {
      if (dy > 0) onDown?.();
      else onUp?.();
    }
  };

  return { onTouchStart, onTouchEnd };
}
