"use client";

import { motion, type Variants } from "motion/react";
import { fadeUp, staggerContainer } from "@/lib/motion/variants";

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds between each child's animation start. */
  staggerDelay?: number;
  once?: boolean;
}

/**
 * Generic scroll-triggered stagger container (Phase 3 "Stagger
 * animations") — wrap a list of `<StaggerItem>` children (grid cards,
 * bullet lists, badge rows). For the product/collection grid specifically,
 * `<Reveal index={i}>` remains the simpler per-card API; reach for this
 * when the parent itself should own the timing.
 */
export function Stagger({
  children,
  className,
  staggerDelay = 0.08,
  once = true,
}: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-10% 0px" }}
      variants={staggerContainer(staggerDelay)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  variants = fadeUp,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}) {
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
