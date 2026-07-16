"use client";

import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { MouseGlow } from "@/components/motion/mouse-glow";
import type { GoogleReview } from "@/features/reviews/google-review.types";

/** Same visual language as TestimonialCard, with a reviewer avatar and a small Google attribution mark in place of the location line. */
export function GoogleReviewCard({ review }: { review: GoogleReview }) {
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
            <p className="line-clamp-6 flex-1 text-sm text-foreground/90 italic">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < review.rating
                      ? "size-3.5 fill-gold text-gold"
                      : "size-3.5 text-border"
                  }
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-muted">
                {review.profilePhotoUrl && (
                  <Image
                    src={review.profilePhotoUrl}
                    alt={review.authorName}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{review.authorName}</p>
                <p className="text-xs text-muted-foreground">
                  {review.relativeTimeDescription} · Google
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </MouseGlow>
    </motion.div>
  );
}
