"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENTS = 5;

/**
 * Client-only admin sidebar UI state — rail-collapse mode, per-group
 * expand/collapse, favorited nav hrefs, and a recently-visited-pages trail.
 * Purely presentational (no server data, no user account tie-in), so plain
 * localStorage persistence is enough — same pattern as
 * `use-recently-viewed-store`.
 */
interface AdminSidebarState {
  collapsed: boolean;
  toggleCollapsed: () => void;

  collapsedGroups: string[];
  toggleGroup: (groupLabel: string) => void;

  favorites: string[];
  toggleFavorite: (href: string) => void;

  recents: string[];
  trackVisit: (href: string) => void;
}

export const useAdminSidebarStore = create<AdminSidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),

      collapsedGroups: ["Coming Soon · Growth", "Coming Soon · Operations"],
      toggleGroup: (groupLabel) =>
        set((s) => ({
          collapsedGroups: s.collapsedGroups.includes(groupLabel)
            ? s.collapsedGroups.filter((g) => g !== groupLabel)
            : [...s.collapsedGroups, groupLabel],
        })),

      favorites: [],
      toggleFavorite: (href) =>
        set((s) => ({
          favorites: s.favorites.includes(href)
            ? s.favorites.filter((f) => f !== href)
            : [...s.favorites, href],
        })),

      recents: [],
      trackVisit: (href) =>
        set((s) => ({
          recents: [href, ...s.recents.filter((r) => r !== href)].slice(
            0,
            MAX_RECENTS,
          ),
        })),
    }),
    { name: "ambika-admin-sidebar" },
  ),
);
