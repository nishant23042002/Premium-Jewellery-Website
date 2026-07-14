"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Periodically re-runs the current route's Server Components
 * (router.refresh()) so server-fetched data — notification counts,
 * reservation status, etc. — stays close to live without the visitor
 * needing to reload. Skips ticks while the tab is hidden so backgrounded
 * tabs don't burn refreshes needlessly.
 *
 * Stopgap for genuine push (Redis-backed SSE) — deliberately the only place
 * polling lives, so it can be swapped out later without touching call sites.
 */
export function useAutoRefresh(intervalMs = 20_000) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
}
