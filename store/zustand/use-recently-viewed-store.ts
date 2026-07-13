"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENTLY_VIEWED = 12;

/** Local-storage viewing history (Phase 5 "Recently Viewed") — most-recent-first, capped, no accounts needed. */
interface RecentlyViewedState {
  productIds: string[];
  track: (productId: string) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      productIds: [],
      track: (productId) =>
        set((state) => ({
          productIds: [
            productId,
            ...state.productIds.filter((id) => id !== productId),
          ].slice(0, MAX_RECENTLY_VIEWED),
        })),
      clear: () => set({ productIds: [] }),
    }),
    { name: "ambika-recently-viewed" },
  ),
);
