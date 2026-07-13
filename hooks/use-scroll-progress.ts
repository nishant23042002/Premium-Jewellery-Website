"use client";

import { useRef } from "react";
import { useScroll, useSpring, type MotionValue } from "motion/react";

export interface ScrollProgressOptions {
  /** Matches Motion's `offset` tuple — when tracking starts/ends relative to the viewport. */
  offset?: [string, string];
  /** Smooths the raw scroll fraction with a spring so transforms don't feel stepped. */
  smooth?: boolean;
}

/**
 * Thin wrapper around Motion's `useScroll`, scoped to one element, for
 * scroll-storytelling sections (Phase 3 "Scroll storytelling", "Parallax").
 * Returns a 0→1 MotionValue driven purely by scroll position — feed it
 * into `useTransform` for opacity/translate/scale, never into React state.
 */
export function useScrollProgress(options: ScrollProgressOptions = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: (options.offset as never) ?? ["start end", "end start"],
  });

  // Always call useSpring (Rules of Hooks) — `smooth` only picks which
  // value we hand back, it never skips the hook call itself.
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    mass: 0.4,
  });
  const progress: MotionValue<number> = options.smooth
    ? smoothed
    : scrollYProgress;

  return { ref, progress };
}
