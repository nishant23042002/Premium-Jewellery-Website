"use client";

import { useEffect } from "react";
import { useWishlistStore } from "@/store/zustand/use-wishlist-store";

/** Bootstraps the in-memory wishlist store from the server-fetched product ids for the current customer — renders nothing. */
export function WishlistHydrator({ productIds }: { productIds: string[] }) {
  const hydrate = useWishlistStore((s) => s.hydrate);

  useEffect(() => {
    hydrate(productIds);
  }, [productIds, hydrate]);

  return null;
}
