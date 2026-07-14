"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductFilters } from "@/hooks/use-product-filters";
import type { ProductSort as ProductSortValue } from "@/features/products/product.actions";

export const SORT_OPTIONS: { value: ProductSortValue; label: string }[] = [
  { value: "newest", label: "Newest Arrivals" },
  { value: "popularity", label: "Popularity" },
  { value: "name_asc", label: "Alphabetically: A to Z" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "weight_asc", label: "Weight: Low to High" },
  { value: "weight_desc", label: "Weight: High to Low" },
  { value: "most_viewed", label: "Most Viewed" },
  { value: "most_reserved", label: "Most Reserved" },
];

/** Sort control for the Products catalogue — reads/writes the `sort` query param via the shared filter hook, page resets to 1. */
export function ProductSort() {
  const { filters, setSort } = useProductFilters();

  return (
    <Select
      value={filters.sort}
      onValueChange={(next) => next && setSort(next as ProductSortValue)}
    >
      <SelectTrigger className="w-[190px]" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
