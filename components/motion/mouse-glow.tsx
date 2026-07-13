"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";

interface MouseGlowProps {
  children: React.ReactNode;
  className?: string;
  /** Any valid CSS color — defaults to the gold token. */
  color?: string;
  /** Glow diameter in px. */
  size?: number;
}

/**
 * Cursor-following radial glow over a card/section (Phase 3 "Mouse
 * lighting") — Apple/Awwwards-style spotlight. Position updates go through
 * a Motion value + `useMotionTemplate`, so the gradient repaints on the
 * compositor without ever causing a React re-render or layout pass.
 */
export function MouseGlow({
  children,
  className,
  color = "var(--gold)",
  size = 340,
}: MouseGlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  const background = useMotionTemplate`radial-gradient(${size}px circle at ${mouseX}px ${mouseY}px, color-mix(in oklch, ${color} 18%, transparent), transparent 75%)`;

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={cn("group relative", className)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      {children}
    </div>
  );
}
