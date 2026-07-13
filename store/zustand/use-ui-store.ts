"use client";

import { create } from "zustand";
import type { Locale } from "@/types/common";

/**
 * Ephemeral, purely client-side widget state — mobile nav, custom cursor
 * variant, locale preference. Deliberately not in Redux: nothing here needs
 * time-travel debugging or cross-slice orchestration, so `useState`-grade
 * Zustand keeps the ceremony down (PRD §33 — no global store unless it
 * earns its keep).
 */
type CursorVariant = "default" | "hover" | "drag" | "hidden";

interface UiStore {
  isMobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  cursorVariant: CursorVariant;
  setCursorVariant: (variant: CursorVariant) => void;

  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isMobileNavOpen: false,
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),

  cursorVariant: "default",
  setCursorVariant: (variant) => set({ cursorVariant: variant }),

  locale: "en",
  setLocale: (locale) => set({ locale }),
}));
