"use client";

import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * Debounced localStorage draft for a form — pure client-side safety net
 * against an accidental tab close / navigation, not a substitute for
 * saving. The caller decides when to offer restoring it (typically once,
 * on mount) and must call `clearDraft()` after a successful submit.
 */
export function useFormAutosaveDraft<T>(key: string, values: T, enabled = true) {
  // react-hook-form's `watch()` returns a new object reference on every
  // render regardless of whether any field actually changed — debouncing
  // that directly would keep resetting the timer on unrelated re-renders
  // and eventually persist whatever transient state happened to be current.
  // Serializing first gives the debounce a stable, content-based value to
  // compare against.
  const serialized = JSON.stringify(values);
  const debouncedSerialized = useDebounce(serialized, 800);
  const isFirstRun = useRef(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    // Skip the initial mount write — that would just re-save whatever the
    // form already loaded with (existing record or blank defaults).
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!enabled) return;
    try {
      localStorage.setItem(key, debouncedSerialized);
      setLastSavedAt(new Date());
    } catch {
      // localStorage can throw in private-browsing/quota-exceeded cases — a
      // lost draft isn't worth surfacing an error over.
    }
  }, [key, debouncedSerialized, enabled]);

  function readDraft(): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to recover from here either.
    }
  }

  return { readDraft, clearDraft, lastSavedAt };
}
