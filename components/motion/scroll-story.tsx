"use client";

import { createContext, useContext } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { cn } from "@/lib/utils";

const ScrollStoryContext = createContext<MotionValue<number> | null>(null);

function useScrollStoryProgress(): MotionValue<number> {
  const ctx = useContext(ScrollStoryContext);
  if (!ctx) {
    throw new Error("ScrollStory.Step must be used inside <ScrollStory>");
  }
  return ctx;
}

interface ScrollStoryProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Scroll-linked narrative container (Phase 3 "Scroll storytelling") — a
 * tall section whose scroll progress (0→1) drives child `<ScrollStory.Step>`
 * opacity/transform. Typical shape: a `position: sticky` visual pinned via
 * CSS (not JS) alongside stacked `<Step>` copy blocks — pass a tall
 * `min-h-[300vh]`-style className on the container per how many steps you
 * have, and `sticky top-0 h-screen` on the pinned visual.
 */
export function ScrollStory({ children, className }: ScrollStoryProps) {
  const { ref, progress } = useScrollProgress({ smooth: true });

  return (
    <ScrollStoryContext.Provider value={progress}>
      <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
        {children}
      </div>
    </ScrollStoryContext.Provider>
  );
}

interface ScrollStoryStepProps {
  children: React.ReactNode;
  className?: string;
  /** Progress range [start, end] (0–1 of the parent's scroll-through) this step is active for. */
  range: [number, number];
}

/** A single narrative beat — fades/lifts in and out as scroll passes through its `range`. */
ScrollStory.Step = function ScrollStoryStep({
  children,
  className,
  range,
}: ScrollStoryStepProps) {
  const progress = useScrollStoryProgress();
  const [start, end] = range;
  const pad = (end - start) * 0.15;

  const opacity = useTransform(
    progress,
    [start, start + pad, end - pad, end],
    [0, 1, 1, 0],
  );
  const y = useTransform(
    progress,
    [start, start + pad, end - pad, end],
    [24, 0, 0, -24],
  );

  return (
    <motion.div
      style={{ opacity, y }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
};
