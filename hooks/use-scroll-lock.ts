"use client";

import { useEffect } from "react";

/** Locks body scroll while a Drawer/Sheet/Dialog with a custom (non-native) overlay is open. */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [locked]);
}
