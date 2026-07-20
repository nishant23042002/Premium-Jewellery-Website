"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ImageWithFallbackProps = ImageProps & {
  /**
   * Classes for the skeleton/fallback panel that sits behind or replaces
   * the image. Defaults to filling an `absolute inset-0` parent, which is
   * how every `fill`-mode next/image call site in this codebase is already
   * structured — pass a shape override (e.g. `"rounded-full"` for an
   * avatar) when the image itself isn't a plain rectangle.
   */
  wrapperClassName?: string;
};

/**
 * Wraps next/image with the two things the plain component doesn't give
 * you: a shimmer skeleton shown until the image actually finishes
 * decoding, and a clean icon+alt-text fallback instead of a browser
 * broken-image glyph if the source 404s or fails to load — both routine
 * on admin-uploaded/Cloudinary photos, which can be deleted, mistyped, or
 * time out. Drop-in replacement for `<Image fill .../>` — same props,
 * assumes the parent is `position: relative` like every existing usage.
 */
export function ImageWithFallback({
  className,
  wrapperClassName,
  alt,
  onLoad,
  onError,
  ...props
}: ImageWithFallbackProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  if (status === "error") {
    return (
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground",
          wrapperClassName,
        )}
      >
        <ImageOff className="size-6" strokeWidth={1.5} aria-hidden />
        {alt && (
          <span className="px-2 text-center text-[11px] leading-tight text-balance">
            {alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      {status === "loading" && (
        <Skeleton
          className={cn("absolute inset-0 rounded-none", wrapperClassName)}
        />
      )}
      <Image
        {...props}
        alt={alt}
        className={cn(
          className,
          "transition-opacity duration-300",
          status === "loading" ? "opacity-0" : "opacity-100",
        )}
        onLoad={(event) => {
          setStatus("loaded");
          onLoad?.(event);
        }}
        onError={(event) => {
          setStatus("error");
          onError?.(event);
        }}
      />
    </>
  );
}
