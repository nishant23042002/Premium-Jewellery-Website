"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DURATION, EASING } from "@/lib/motion/easings";
import { fadeUp, staggerContainer } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

interface HeroRevealProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Stagger container for a hero's stacked pieces (eyebrow, heading, subcopy,
 * CTA) — Phase 3 "Hero animations". Fires on mount (heroes are always
 * above the fold, so `whileInView` would fire immediately anyway).
 */
export function HeroReveal({ children, className }: HeroRevealProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.12, 0.1)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroRevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

const wordVariants = {
  hidden: { y: "110%" },
  visible: {
    y: "0%",
    transition: { duration: DURATION.slower, ease: EASING.out },
  },
};

/**
 * Word-by-word masked reveal for a hero headline — each word slides up
 * from behind an `overflow-hidden` mask. `transform: translateY` only,
 * fully GPU-composited. Screen readers get the plain text via `aria-label`
 * on the heading; the animated words are `aria-hidden`.
 */
export function HeroHeading({
  text,
  className,
  as: Component = "h1",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(" ");

  // Deferred to post-mount: `useReducedMotion()` reads `matchMedia`, which
  // isn't available during SSR. Branching on it directly during the first
  // render would make the client's initial output diverge from the
  // server-rendered HTML (this component's two branches emit different DOM
  // structure, not just different prop values) — so `mounted` keeps that
  // first client render identical to the server's, and only swaps to the
  // reduced-motion version on the next paint, which is a normal update.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (mounted && shouldReduceMotion) {
    return <Component className={className}>{text}</Component>;
  }

  return (
    <Component aria-label={text} className={className}>
      <motion.span
        aria-hidden
        initial="hidden"
        animate="visible"
        variants={staggerContainer(0.07)}
        className="inline"
      >
        {words.map((word, i) => (
          <span
            key={i}
            className="inline-block overflow-hidden pb-[0.1em] align-bottom"
          >
            <motion.span
              variants={wordVariants}
              className={cn(
                "inline-block",
                i < words.length - 1 && "mr-[0.28em]",
              )}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Component>
  );
}
