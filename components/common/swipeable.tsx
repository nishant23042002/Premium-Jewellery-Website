"use client";

import { motion, type PanInfo } from "motion/react";
import { DURATION, EASING } from "@/lib/motion/easings";
import { cn } from "@/lib/utils";

interface SwipeableProps {
  children: React.ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Px of drag travel before a swipe fires. */
  threshold?: number;
}

/**
 * Drag-to-dismiss/advance with elastic spring-back (Phase 3 "Mobile
 * gestures") — for the shortlist drawer, gallery advance, or a future
 * order-history swipe-to-archive. Built on Motion's `drag`, which is
 * itself transform-driven (translate3d), so the drag itself never
 * triggers layout even mid-gesture.
 */
export function Swipeable({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
}: SwipeableProps) {
  function handleDragEnd(
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) {
    if (info.offset.x <= -threshold) onSwipeLeft?.();
    else if (info.offset.x >= threshold) onSwipeRight?.();
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      transition={{ duration: DURATION.base, ease: EASING.out }}
      className={cn("touch-pan-y will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
