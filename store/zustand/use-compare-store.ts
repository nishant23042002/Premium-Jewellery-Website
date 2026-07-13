"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_COMPARE = 4;

/** Side-by-side comparison list (Phase 5 "Comparison") — capped at 4 so the comparison table stays readable. */
interface CompareState {
  productIds: string[];
  add: (productId: string) => boolean;
  remove: (productId: string) => void;
  toggle: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
  isFull: () => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      productIds: [],
      /** Returns false (and no-ops) if already at MAX_COMPARE — callers should toast on false. */
      add: (productId) => {
        const { productIds } = get();
        if (productIds.includes(productId)) return true;
        if (productIds.length >= MAX_COMPARE) return false;
        set({ productIds: [...productIds, productId] });
        return true;
      },
      remove: (productId) =>
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        })),
      toggle: (productId) =>
        get().has(productId)
          ? get().remove(productId)
          : void get().add(productId),
      clear: () => set({ productIds: [] }),
      has: (productId) => get().productIds.includes(productId),
      isFull: () => get().productIds.length >= MAX_COMPARE,
    }),
    { name: "ambika-compare" },
  ),
);
