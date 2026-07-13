"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
  color?: string;
}

/**
 * Ambient decorative particles drifting upward (Phase 3 "Floating
 * particles") — purely atmospheric, `aria-hidden`, absolutely positioned
 * so it never affects document layout. Particle positions are randomized
 * client-side only (generated in an effect, not during render) to avoid a
 * server/client hydration mismatch from `Math.random()`. Animates
 * `transform`/`opacity` only, capped at a low count to stay cheap.
 */
export function FloatingParticles({
  count = 14,
  className,
  color = "var(--gold)",
}: FloatingParticlesProps) {
  const shouldReduceMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[] | null>(null);

  useEffect(() => {
    if (shouldReduceMotion) return;
    setParticles(
      Array.from({ length: count }, (_, id) => ({
        id,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        duration: 10 + Math.random() * 10,
        delay: Math.random() * 8,
      })),
    );
  }, [count, shouldReduceMotion]);

  if (shouldReduceMotion || !particles) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full will-change-transform"
          style={{
            left: `${p.left}%`,
            bottom: "-5%",
            width: p.size,
            height: p.size,
            backgroundColor: color,
          }}
          animate={{ y: ["0vh", "-110vh"], opacity: [0, 0.5, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
