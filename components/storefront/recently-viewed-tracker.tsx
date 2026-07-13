"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/store/zustand/use-recently-viewed-store";

/** Mount once on the product detail page — records the view, renders nothing. */
export function RecentlyViewedTracker({ productId }: { productId: string }) {
  const track = useRecentlyViewedStore((s) => s.track);

  useEffect(() => {
    track(productId);
  }, [productId, track]);

  return null;
}
