"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENT_SEARCHES = 8;

/** Local-storage search history — most-recent-first, capped, no accounts needed. Same pattern as useRecentlyViewedStore. */
interface RecentSearchesState {
  queries: string[];
  track: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
}

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      queries: [],
      track: (query) => {
        const normalized = query.trim();
        if (!normalized) return;
        set((state) => ({
          queries: [
            normalized,
            ...state.queries.filter(
              (q) => q.toLowerCase() !== normalized.toLowerCase(),
            ),
          ].slice(0, MAX_RECENT_SEARCHES),
        }));
      },
      remove: (query) =>
        set((state) => ({
          queries: state.queries.filter((q) => q !== query),
        })),
      clear: () => set({ queries: [] }),
    }),
    { name: "ambika-recent-searches" },
  ),
);
