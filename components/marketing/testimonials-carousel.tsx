"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import type { Testimonial } from "@/features/testimonials/testimonial.types";

/**
 * Mobile-only horizontal rail for testimonials — the desktop/tablet grid
 * (sm:2 lg:4 columns) stays untouched and is rendered separately. Unlike
 * the shared `Carousel` (deliberately no auto-play), this one auto-advances
 * every 4s since the testimonials section is purely decorative social proof
 * and benefits from motion in the compact mobile space it now occupies.
 */
export function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [
      Autoplay({
        delay: 4000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  // WCAG 2.2.2 — don't auto-advance continuously-moving content when the
  // visitor has asked for reduced motion; prev/next buttons still work.
  useEffect(() => {
    if (!emblaApi || !shouldReduceMotion) return;
    const autoplay = emblaApi.plugins().autoplay as
      | { stop: () => void }
      | undefined;
    autoplay?.stop();
  }, [emblaApi, shouldReduceMotion]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {testimonials.map((testimonial) => (
            <div
              className="min-w-0 shrink-0 grow-0 basis-4/5"
              key={testimonial.id}
            >
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={scrollPrev}
          className="focus-luxury flex size-8 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex gap-1.5">
          {scrollSnaps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selectedIndex ? "w-6 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next testimonial"
          onClick={scrollNext}
          className="focus-luxury flex size-8 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
