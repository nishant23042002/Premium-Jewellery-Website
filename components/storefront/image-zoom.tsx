"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Product photography zoom (Phase 5 "Image Zoom") — desktop hover follows
 * the cursor with a CSS `transform-origin` scale (cheap, GPU-composited,
 * no magnifier-lens DOM overlay needed); tap-to-open a fullscreen lightbox
 * covers mobile, where hover doesn't apply.
 */
export function ImageZoom({ src, alt, className }: ImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("50% 50%");
  const [isZoomed, setIsZoomed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "group relative cursor-zoom-in overflow-hidden",
          className,
        )}
        onPointerMove={handlePointerMove}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onClick={() => setLightboxOpen(true)}
        role="button"
        aria-label={`Zoom in on ${alt}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 40vw, 90vw"
          className="object-cover transition-transform duration-300 ease-out"
          style={{
            transformOrigin: origin,
            transform: isZoomed ? "scale(1.8)" : "scale(1)",
          }}
        />
        <div className="pointer-events-none absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-white/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="size-4" />
        </div>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none sm:max-w-3xl">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
