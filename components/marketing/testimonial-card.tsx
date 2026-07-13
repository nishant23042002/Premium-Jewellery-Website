"use client";

import { Quote, Star } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { MouseGlow } from "@/components/motion/mouse-glow";
import type { Testimonial } from "@/features/testimonials/testimonial.types";

/** Same lift + cursor-glow hover pattern as CollectionCard/ProductCard/BlogCard. */
export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <motion.div
      className="h-full"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <MouseGlow color="var(--gold-light)" className="h-full rounded-xl">
        <Card className="h-full border-border/60 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <CardContent className="flex h-full flex-col gap-4 pt-2">
            <Quote className="size-6 text-gold" strokeWidth={1.5} />
            <p className="flex-1 text-sm text-foreground/90 italic">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < testimonial.rating
                      ? "size-3.5 fill-gold text-gold"
                      : "size-3.5 text-border"
                  }
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-medium">{testimonial.name}</p>
              <p className="text-xs text-muted-foreground">
                {testimonial.location}
              </p>
            </div>
          </CardContent>
        </Card>
      </MouseGlow>
    </motion.div>
  );
}
