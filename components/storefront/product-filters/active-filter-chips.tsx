"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProductFilters } from "@/hooks/use-product-filters";
import { formatINR } from "@/lib/utils/format";
import type { Category } from "@/features/categories/category.types";
import type { Collection } from "@/features/collections/collection.types";

const METAL_LABELS: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  platinum: "Platinum",
  diamond: "Diamond",
  other: "Other",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  in_showroom: "In Showroom",
  made_to_order: "Made to Order",
  reserved: "Reserved",
};

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** Row of removable pills summarizing every active filter — lets a shopper see (and undo) their exact filter state at a glance without opening the panel. */
export function ActiveFilterChips({
  categories,
  collections,
}: {
  categories: Category[];
  collections: Collection[];
}) {
  const { filters, toggleCategory, clearFilter } = useProductFilters();

  const chips: Chip[] = [];

  for (const slug of filters.categorySlugs) {
    const category = categories.find((c) => c.slug === slug);
    chips.push({
      key: `category-${slug}`,
      label: category?.name.en ?? slug,
      onRemove: () => toggleCategory(slug),
    });
  }

  if (filters.collectionSlug) {
    const collection = collections.find((c) => c.slug === filters.collectionSlug);
    chips.push({
      key: "collection",
      label: collection?.name.en ?? filters.collectionSlug,
      onRemove: () => clearFilter("collection"),
    });
  }

  for (const metal of filters.metalTypes) {
    chips.push({
      key: `metal-${metal}`,
      label: METAL_LABELS[metal] ?? metal,
      onRemove: () => clearFilter("metal"),
    });
  }

  for (const availability of filters.availabilities) {
    chips.push({
      key: `availability-${availability}`,
      label: AVAILABILITY_LABELS[availability] ?? availability,
      onRemove: () => clearFilter("availability"),
    });
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    chips.push({
      key: "price",
      label: `${filters.priceMin !== undefined ? formatINR(filters.priceMin) : "₹0"} – ${
        filters.priceMax !== undefined ? formatINR(filters.priceMax) : "No max"
      }`,
      onRemove: () => clearFilter("price"),
    });
  }

  if (filters.weightMin !== undefined || filters.weightMax !== undefined) {
    chips.push({
      key: "weight",
      label: `${filters.weightMin ?? 0}g – ${filters.weightMax ?? "∞"}g`,
      onRemove: () => clearFilter("weight"),
    });
  }

  if (filters.newArrivalOnly) {
    chips.push({
      key: "new",
      label: "New Arrivals",
      onRemove: () => clearFilter("new"),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="outline"
          className="gap-1 py-1 pr-1.5 pl-2.5 text-xs"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter`}
            onClick={chip.onRemove}
            className="flex size-4 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
