"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useUiStore } from "@/store/zustand/use-ui-store";

const CURSOR_SIZE: Record<string, number> = {
  default: 10,
  hover: 48,
  drag: 64,
  hidden: 0,
};

/**
 * Restrained luxury cursor accent — a small dot that magnifies over
 * interactive/product imagery (PRD Phase 2 "Cursor Effects"). Desktop
 * (fine-pointer) only; never renders on touch devices, and never replaces
 * the native cursor (accessibility — PRD §19).
 */
export function CustomCursor() {
  const cursorVariant = useUiStore((state) => state.cursorVariant);
  const [isFinePointer, setIsFinePointer] = useState(false);
  // `x`/`y` start at (0,0) — without this, the dot renders pinned to the
  // top-left corner until the pointer's first real `mousemove`, which reads
  // as a stray leftover dot on the page.
  const [hasMoved, setHasMoved] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: fine)");
    setIsFinePointer(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) =>
      setIsFinePointer(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isFinePointer) return;
    const handleMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHasMoved(true);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [isFinePointer, x, y]);

  if (!isFinePointer || !hasMoved) return null;

  const size = CURSOR_SIZE[cursorVariant];

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] rounded-full mix-blend-difference"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        backgroundColor: "var(--color-gold)",
      }}
      animate={{ width: size, height: size, opacity: size === 0 ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    />
  );
}
