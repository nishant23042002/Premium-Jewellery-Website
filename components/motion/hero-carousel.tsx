"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useReducedMotion } from "motion/react";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/features/hero-slides/hero-slide.types";

interface HeroCarouselProps {
  slides: HeroSlide[];
  className?: string;
}

const AUTOPLAY_DELAY_MS = 5000;

/**
 * Full-bleed hero banner carousel. Every slide is a complete, pre-designed
 * marketing image with copy/branding already baked in by whoever designed
 * it — this component renders nothing but the images themselves plus dot
 * navigation, no overlaid heading/CTA/scrim. Each slide ships a separate
 * mobile-portrait and desktop-wide crop; both render server-side and are
 * toggled purely by CSS (`hidden sm:block` / `block sm:hidden`), matching
 * the same SSR-safe breakpoint-swap pattern as `CategoryShowcaseGrid` — no
 * client-side media-query hook, no hydration-mismatch risk. Autoplays via
 * the official Embla plugin, pausing on hover and resuming after manual
 * dot navigation.
 */
export function HeroCarousel({ slides, className }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({
      delay: AUTOPLAY_DELAY_MS,
      stopOnMouseEnter: true,
      stopOnInteraction: false,
    }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  // WCAG 2.2.2 — continuously auto-advancing content must be stoppable;
  // simplest compliant behavior here is to not auto-advance at all when the
  // visitor has asked for reduced motion, leaving manual dot navigation.
  useEffect(() => {
    if (!emblaApi || !shouldReduceMotion) return;
    const autoplay = emblaApi.plugins().autoplay as
      | { stop: () => void }
      | undefined;
    autoplay?.stop();
  }, [emblaApi, shouldReduceMotion]);

  if (slides.length === 0) return null;

  return (
    <div className={cn("relative mb-10 w-full", className)}>
      <div
        className="mx-auto my-1 aspect-4/5 w-[95%] overflow-hidden rounded-md sm:aspect-14/6"
        ref={emblaRef}
      >
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className="relative h-full min-w-0 shrink-0 grow-0 basis-full"
            >
              <ImageWithFallback
                src={slide.mobileImageUrl}
                alt={slide.altText}
                fill
                priority={i === 0}
                sizes="100vw"
                className="block object-cover sm:hidden"
              />
              <ImageWithFallback
                src={slide.desktopImageUrl}
                alt={slide.altText}
                fill
                priority={i === 0}
                sizes="100vw"
                className="hidden object-center sm:block"
              />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2 sm:bottom-6">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selectedIndex ? "w-6 bg-white" : "w-1.5 bg-white/60",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
