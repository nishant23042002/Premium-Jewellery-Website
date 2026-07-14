"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StylingStoryResolved } from "@/features/styling-stories/styling-story.types";

const OFFSET_STEP_PX = 130;
const VISIBLE_RANGE = 2;

/** Shortest signed distance from `activeIndex` to `index` on a circular list — lets the stack settle either direction instead of always unwinding the long way round. */
function circularOffset(index: number, activeIndex: number, length: number) {
  let offset = index - activeIndex;
  if (offset > length / 2) offset -= length;
  if (offset < -length / 2) offset += length;
  return offset;
}

/**
 * The "Ways to Wear It" reel — an overlapping stack of story cards (Tanishq
 * style): the active card is centered, adjacent cards peek from behind at
 * reduced scale/opacity/rotation. Clicking a side card (or the physical
 * arrow buttons) brings it to focus. `overflow-hidden` on the stack
 * wrapper keeps peeking cards clipped to the section instead of causing
 * horizontal page overflow on narrow screens.
 */
export function StylingStoryCarousel({
  stories,
}: {
  stories: StylingStoryResolved[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(
        ((index % stories.length) + stories.length) % stories.length,
      );
    },
    [stories.length],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);

  if (stories.length === 0) return null;
  const activeStory = stories[activeIndex];

  return (
    <div>
      <div className="text-center">
        <p className="font-heading text-2xl sm:text-3xl">{activeStory.title}</p>
        {activeStory.subtitle && (
          <p className="mt-2 text-sm text-muted-foreground">
            {activeStory.subtitle}
          </p>
        )}
      </div>

      <div className="relative flex h-[480px] items-center justify-center overflow-hidden sm:h-[680px]">
        {stories.length > 1 && (
          <button
            type="button"
            aria-label="Previous story"
            onClick={goPrev}
            className="focus-luxury absolute top-1/2 left-2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 shadow-md sm:left-6"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}

        {stories.map((story, index) => {
          const offset = circularOffset(index, activeIndex, stories.length);
          if (Math.abs(offset) > VISIBLE_RANGE) return null;
          const isActive = offset === 0;

          // Video only plays on the centered card — peeking neighbors show
          // their poster image, so at most one video decodes at a time.
          const playVideo = isActive && story.videoUrl;

          return (
            <button
              key={story.id}
              type="button"
              aria-label={isActive ? story.title : `Show ${story.title}`}
              onClick={() => goTo(index)}
              className="absolute top-1/2 left-1/2 aspect-[5/8] w-56 overflow-hidden rounded-2xl border border-border shadow-xl transition-all duration-500 ease-out sm:w-84"
              style={{
                transform: `translate(-50%, -50%) translateX(${offset * OFFSET_STEP_PX}px) scale(${1 - Math.abs(offset) * 0.12}) rotate(${offset * 6}deg)`,
                zIndex: 10 - Math.abs(offset),
                opacity: 1 - Math.abs(offset) * 0.3,
              }}
            >
              {playVideo ? (
                <video
                  key={story.videoUrl}
                  src={story.videoUrl}
                  poster={story.coverImageUrl}
                  className="size-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <Image
                  src={story.coverImageUrl}
                  alt={story.title}
                  fill
                  sizes="(min-width: 640px) 288px, 224px"
                  className="object-cover"
                />
              )}
            </button>
          );
        })}

        {stories.length > 1 && (
          <button
            type="button"
            aria-label="Next story"
            onClick={goNext}
            className="focus-luxury absolute top-1/2 right-2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 shadow-md sm:right-6"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
}
