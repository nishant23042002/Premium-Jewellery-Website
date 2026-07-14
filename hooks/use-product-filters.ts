"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  filterStateToParams,
  parseProductFilters,
  toggleInArray,
  type ProductFilterState,
} from "@/lib/products/filter-params";
import type { ProductSort } from "@/features/products/product.actions";
import type { Product } from "@/features/products/product.types";

/**
 * Client-side controller for the catalogue filter panel/sheet — reads the
 * current filter state straight from the URL (so it survives reload, back/
 * forward, and is trivially shareable) and pushes updates via
 * `router.push(..., { scroll: false })` wrapped in a transition, so the
 * page never does a full document reload and `isPending` can drive an
 * "optimistic" dimmed/disabled state on the panel while the RSC re-fetch
 * (shown via the route's `loading.tsx`) is in flight.
 */
export function useProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseProductFilters(Object.fromEntries(searchParams.entries()));

  const push = useCallback(
    (next: ProductFilterState) => {
      const params = new URLSearchParams(filterStateToParams(next));
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  // Any facet change resets pagination — showing page 4 of a now-different
  // result set is confusing, not helpful.
  const withPageReset = useCallback(
    (patch: Partial<ProductFilterState>) => push({ ...filters, ...patch, page: 1 }),
    [filters, push],
  );

  return {
    filters,
    isPending,
    setSort: (sort: ProductSort) => push({ ...filters, sort, page: 1 }),
    setPage: (page: number) => push({ ...filters, page }),
    toggleCategory: (slug: string) =>
      withPageReset({ categorySlugs: toggleInArray(filters.categorySlugs, slug) }),
    setCollection: (slug: string | undefined) =>
      withPageReset({ collectionSlug: slug }),
    toggleMetalType: (metal: Product["metalType"]) =>
      withPageReset({ metalTypes: toggleInArray(filters.metalTypes, metal) }),
    toggleAvailability: (availability: Product["availability"]) =>
      withPageReset({
        availabilities: toggleInArray(filters.availabilities, availability),
      }),
    setPriceRange: (priceMin: number | undefined, priceMax: number | undefined) =>
      withPageReset({ priceMin, priceMax }),
    setWeightRange: (weightMin: number | undefined, weightMax: number | undefined) =>
      withPageReset({ weightMin, weightMax }),
    setNewArrivalOnly: (newArrivalOnly: boolean) => withPageReset({ newArrivalOnly }),
    clearFilter: (
      key: "category" | "collection" | "metal" | "availability" | "price" | "weight" | "new",
    ) => {
      switch (key) {
        case "category":
          return withPageReset({ categorySlugs: [] });
        case "collection":
          return withPageReset({ collectionSlug: undefined });
        case "metal":
          return withPageReset({ metalTypes: [] });
        case "availability":
          return withPageReset({ availabilities: [] });
        case "price":
          return withPageReset({ priceMin: undefined, priceMax: undefined });
        case "weight":
          return withPageReset({ weightMin: undefined, weightMax: undefined });
        case "new":
          return withPageReset({ newArrivalOnly: false });
      }
    },
    clearAll: () =>
      push({
        categorySlugs: [],
        collectionSlug: undefined,
        metalTypes: [],
        availabilities: [],
        priceMin: undefined,
        priceMax: undefined,
        weightMin: undefined,
        weightMax: undefined,
        newArrivalOnly: false,
        sort: filters.sort,
        page: 1,
      }),
  };
}
