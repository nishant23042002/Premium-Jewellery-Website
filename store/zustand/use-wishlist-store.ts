"use client";

import { create } from "zustand";
import { toggleWishlistItem } from "@/features/wishlist/wishlist.actions";
import { toast } from "@/lib/toast";

/**
 * DB-backed wishlist (replaces the old localStorage-only shortlist) — one
 * per customer account, persists across devices/logout/login. State here is
 * an in-memory mirror hydrated once from the server (see
 * `WishlistHydrator`); `toggle` updates optimistically and reconciles with
 * the server action, reverting on failure (e.g. session expired).
 */
interface WishlistState {
  productIds: string[];
  hydrated: boolean;
  hydrate: (ids: string[]) => void;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  productIds: [],
  hydrated: false,
  hydrate: (ids) => set({ productIds: ids, hydrated: true }),
  has: (productId) => get().productIds.includes(productId),
  toggle: (productId) => {
    const wasWishlisted = get().has(productId);
    set((state) => ({
      productIds: wasWishlisted
        ? state.productIds.filter((id) => id !== productId)
        : [...state.productIds, productId],
    }));

    toggleWishlistItem(productId)
      .then((result) => {
        if (!result.success) {
          // Revert the optimistic update — most commonly a session that
          // expired between page load and this click.
          set((state) => ({
            productIds: wasWishlisted
              ? [...state.productIds, productId]
              : state.productIds.filter((id) => id !== productId),
          }));
          toast.error("Couldn't update wishlist", result.error);
        }
      })
      .catch(() => {
        set((state) => ({
          productIds: wasWishlisted
            ? [...state.productIds, productId]
            : state.productIds.filter((id) => id !== productId),
        }));
        toast.error("Sign in to save items to your wishlist");
      });
  },
}));
