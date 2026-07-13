"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { DURATION, EASING } from "@/lib/motion/easings";

type RevealDirection = "up" | "left" | "right" | "scale" | "fade";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger index — multiplied by ~40ms per PRD §25 grid-reveal spec. */
  index?: number;
  y?: number;
  direction?: RevealDirection;
}

function buildOffset(direction: RevealDirection, y: number) {
  switch (direction) {
    case "left":
      return { x: -24, y: 0 };
    case "right":
      return { x: 24, y: 0 };
    case "scale":
      return { x: 0, y: 0, scale: 0.94 };
    case "fade":
      return { x: 0, y: 0 };
    case "up":
    default:
      return { x: 0, y };
  }
}

/**
 * Scroll-triggered reveal — the storefront's default "content earns its
 * entrance" pattern (PRD §15/§24, Phase 3 "Section reveal animations").
 * Fires once, respects prefers-reduced-motion by skipping the transform
 * entirely (opacity-only fade remains). Animates only opacity/transform.
 */
export function Reveal({
  children,
  className,
  index = 0,
  y = 16,
  direction = "up",
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const offset = buildOffset(direction, y);

  // `hidden`/`visible` geometry never branches on `shouldReduceMotion` —
  // SSR can't see `matchMedia`, so a conditional offset here would make the
  // server-rendered transform diverge from the client's first-paint value
  // and trip a hydration mismatch (see the note in page-transition.tsx).
  // Reduced motion is honored via `transition.duration`/`delay` instead.
  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: offset.x,
      y: offset.y,
      scale: offset.scale ?? 1,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : DURATION.slow,
        ease: EASING.out,
        delay: shouldReduceMotion ? 0 : index * 0.04,
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
