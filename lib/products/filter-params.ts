import type { ProductSort } from "@/features/products/product.actions";
import type { Product } from "@/features/products/product.types";

/**
 * Single source of truth for how catalogue filters round-trip through the
 * URL — every facet is comma-separated within its own param (multi-select,
 * OR'd within a facet) and different params AND together, e.g.
 * `?category=rings,earrings&metal=gold&priceMax=50000` means
 * "(rings OR earrings) AND gold AND price <= 50000". Kept framework-free
 * (no `use client`) so both the Server Component page and client filter
 * controls import the exact same parsing/serialization logic.
 */
export interface ProductFilterState {
  categorySlugs: string[];
  collectionSlug?: string;
  metalTypes: Product["metalType"][];
  availabilities: Product["availability"][];
  priceMin?: number;
  priceMax?: number;
  weightMin?: number;
  weightMax?: number;
  newArrivalOnly: boolean;
  sort: ProductSort;
  page: number;
}

export const VALID_SORTS: ProductSort[] = [
  "newest",
  "popularity",
  "name_asc",
  "price_asc",
  "price_desc",
  "weight_asc",
  "weight_desc",
  "most_viewed",
  "most_reserved",
];

export const VALID_METAL_TYPES: Product["metalType"][] = [
  "gold",
  "silver",
  "platinum",
  "diamond",
  "other",
];

export const VALID_AVAILABILITIES: Product["availability"][] = [
  "in_showroom",
  "made_to_order",
  "reserved",
];

export type ProductSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function csv(value: string | string[] | undefined): string[] {
  const raw = first(value);
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function num(value: string | string[] | undefined): number | undefined {
  const raw = first(value);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseProductFilters(
  searchParams: ProductSearchParams,
): ProductFilterState {
  const sortRaw = first(searchParams.sort);
  const sort = VALID_SORTS.includes(sortRaw as ProductSort)
    ? (sortRaw as ProductSort)
    : "newest";

  const pageRaw = Number(first(searchParams.page));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  return {
    categorySlugs: csv(searchParams.category),
    collectionSlug: first(searchParams.collection),
    metalTypes: csv(searchParams.metal).filter((m): m is Product["metalType"] =>
      VALID_METAL_TYPES.includes(m as Product["metalType"]),
    ),
    availabilities: csv(searchParams.availability).filter(
      (a): a is Product["availability"] =>
        VALID_AVAILABILITIES.includes(a as Product["availability"]),
    ),
    priceMin: num(searchParams.priceMin),
    priceMax: num(searchParams.priceMax),
    weightMin: num(searchParams.weightMin),
    weightMax: num(searchParams.weightMax),
    newArrivalOnly: first(searchParams.new) === "1",
    sort,
    page,
  };
}

/** Counts only the "real" filter facets (not sort/page) — drives the "N filters active" badge. */
export function countActiveFilters(state: ProductFilterState): number {
  let count = 0;
  if (state.categorySlugs.length) count += state.categorySlugs.length;
  if (state.collectionSlug) count += 1;
  if (state.metalTypes.length) count += state.metalTypes.length;
  if (state.availabilities.length) count += state.availabilities.length;
  if (state.priceMin !== undefined || state.priceMax !== undefined) count += 1;
  if (state.weightMin !== undefined || state.weightMax !== undefined) count += 1;
  if (state.newArrivalOnly) count += 1;
  return count;
}

/** Builds a `key=value` pair list (URLSearchParams-ready) from filter state, dropping empty/default values so the URL stays clean and shareable. */
export function filterStateToParams(
  state: ProductFilterState,
): [string, string][] {
  const pairs: [string, string][] = [];
  if (state.categorySlugs.length) pairs.push(["category", state.categorySlugs.join(",")]);
  if (state.collectionSlug) pairs.push(["collection", state.collectionSlug]);
  if (state.metalTypes.length) pairs.push(["metal", state.metalTypes.join(",")]);
  if (state.availabilities.length)
    pairs.push(["availability", state.availabilities.join(",")]);
  if (state.priceMin !== undefined) pairs.push(["priceMin", String(state.priceMin)]);
  if (state.priceMax !== undefined) pairs.push(["priceMax", String(state.priceMax)]);
  if (state.weightMin !== undefined) pairs.push(["weightMin", String(state.weightMin)]);
  if (state.weightMax !== undefined) pairs.push(["weightMax", String(state.weightMax)]);
  if (state.newArrivalOnly) pairs.push(["new", "1"]);
  if (state.sort !== "newest") pairs.push(["sort", state.sort]);
  if (state.page > 1) pairs.push(["page", String(state.page)]);
  return pairs;
}

export function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
