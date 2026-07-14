"use client";

import { useEffect, useState } from "react";

/**
 * Re-runs `fetcher` (typically a Server Action) on an interval and keeps its
 * latest result in state — for small, frequently-relevant values (like the
 * header's reservation-status dot) where a full `router.refresh()` would be
 * wasteful since it re-fetches everything else on the page too. Skips ticks
 * while the tab is hidden. Stopgap for genuine push — see use-auto-refresh.
 */
export function usePolledValue<T>(
  fetcher: () => Promise<T>,
  initialValue: T,
  { intervalMs = 20_000, enabled = true }: { intervalMs?: number; enabled?: boolean } = {},
): T {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetcher().then(setValue).catch(() => {});
    }, intervalMs);
    return () => clearInterval(id);
  }, [fetcher, enabled, intervalMs]);

  return value;
}
