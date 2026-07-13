"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

/**
 * Lenis caches the page's scrollable height and doesn't automatically
 * notice when it changes — without this, scrolling can feel "stuck" before
 * the real bottom (dragging the native scrollbar bypasses Lenis and reveals
 * the correct, larger height).
 *
 * This used to be a single fixed-delay timeout after route changes, tuned
 * to outlast an enter-fade animation. That was fragile: on pages where
 * images, fonts, or async content settle later than the guessed delay,
 * Lenis cached a too-short height and got stuck again — the intermittent
 * "have to manually drag the scrollbar" bug. A ResizeObserver on <body> is
 * the correct fix: it reacts to the page's actual rendered height whenever
 * it changes, for any reason, instead of a guessed timing window.
 */
export function LenisResizeOnRouteChange() {
  const pathname = usePathname();
  const lenis = useLenis();

  // Resize immediately on route change too — content swaps synchronously
  // during React's commit, and there's no reason to wait for the observer's
  // next tick when we already know navigation just happened.
  useEffect(() => {
    lenis?.resize();
  }, [pathname, lenis]);

  useEffect(() => {
    if (!lenis) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => lenis.resize(), 100);
    });
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [lenis]);

  return null;
}
