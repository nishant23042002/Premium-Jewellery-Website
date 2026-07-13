"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageReveal } from "@/components/motion/image-reveal";
import { ImageZoom } from "@/components/storefront/image-zoom";
import { ProductViewerFallback } from "@/components/three/product-viewer-fallback";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types/common";
import type {
  ProductImage,
  ProductVideo,
} from "@/features/products/product.types";

// React Three Fiber + Drei + Three.js are a heavy dependency (hundreds of
// KB) — code-split so they only ship to the browser when a shopper
// actually opens the 360° tab, instead of bloating every product page's
// initial bundle (this alone was ~350KB of the product page's First Load
// JS before being split out).
const ProductViewerCanvas = dynamic(
  () =>
    import("@/components/three/product-viewer-canvas").then(
      (mod) => mod.ProductViewerCanvas,
    ),
  { ssr: false, loading: () => <ProductViewerFallback /> },
);

interface ProductGalleryProps {
  images: ProductImage[];
  videos?: ProductVideo[];
  productName: string;
  locale?: Locale;
  /** No real per-product 3D models exist yet — off by default; the placeholder viewer is available on request. */
  show360?: boolean;
}

/**
 * Main image + thumbnail strip, e-commerce-standard layout — the previous
 * version reused the multi-item rail `Carousel` component (built for
 * peeking card grids, `basis-1/3` etc.) for a single-image-per-view
 * gallery, which is why the nav arrows rendered detached from a
 * shrunken-to-a-third image. Every slide here is always full-width; the
 * arrows are overlaid directly on the image they control.
 */
function PhotosPane({
  images,
  productName,
  locale,
}: {
  images: ProductImage[];
  productName: string;
  locale: Locale;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">
        No image yet
      </div>
    );
  }

  const active = images[activeIndex];
  const goPrev = () =>
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % images.length);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        <ImageReveal className="absolute inset-0">
          <ImageZoom
            key={active.publicId}
            src={active.url}
            alt={active.altText?.[locale] ?? productName}
            className="h-full w-full"
          />
        </ImageReveal>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={goPrev}
              className="focus-luxury absolute top-1/2 left-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 shadow-md backdrop-blur-sm transition-colors hover:border-gold/40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={goNext}
              className="focus-luxury absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 shadow-md backdrop-blur-sm transition-colors hover:border-gold/40"
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.publicId}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:w-20",
                i === activeIndex
                  ? "border-gold"
                  : "border-transparent hover:border-border",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductGallery({
  images,
  videos = [],
  productName,
  locale = "en",
  show360 = false,
}: ProductGalleryProps) {
  const hasVideos = videos.length > 0;
  const hasMultipleTabs = hasVideos || show360;

  const photosPane = (
    <PhotosPane images={images} productName={productName} locale={locale} />
  );

  if (!hasMultipleTabs) {
    return photosPane;
  }

  return (
    <Tabs defaultValue="photos">
      <TabsList className="mb-3">
        <TabsTrigger value="photos">Photos</TabsTrigger>
        {show360 && <TabsTrigger value="360">360° View</TabsTrigger>}
        {hasVideos && <TabsTrigger value="video">Video</TabsTrigger>}
      </TabsList>

      <TabsContent value="photos">{photosPane}</TabsContent>

      {show360 && (
        <TabsContent value="360">
          <ProductViewerCanvas className="aspect-square overflow-hidden rounded-2xl bg-muted" />
        </TabsContent>
      )}

      {hasVideos && (
        <TabsContent value="video" className="space-y-3">
          {videos.map((video) => (
            <video
              key={video.publicId}
              src={video.url}
              controls
              playsInline
              className="aspect-square w-full rounded-2xl bg-black object-contain"
            >
              {video.title}
            </video>
          ))}
        </TabsContent>
      )}
    </Tabs>
  );
}
