"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProductFilters } from "@/hooks/use-product-filters";
import { formatINR } from "@/lib/utils/format";
import { t } from "@/lib/i18n/dictionary";
import type { Category } from "@/features/categories/category.types";
import type { Collection } from "@/features/collections/collection.types";
import type { Locale, LocalizedText } from "@/types/common";

const METAL_LABELS: Record<string, LocalizedText> = {
  gold: { en: "Gold", hi: "सोना", mr: "सोने" },
  silver: { en: "Silver", hi: "चांदी", mr: "चांदी" },
  platinum: { en: "Platinum", hi: "प्लैटिनम", mr: "प्लॅटिनम" },
  diamond: { en: "Diamond", hi: "हीरा", mr: "हिरा" },
  other: { en: "Other", hi: "अन्य", mr: "इतर" },
};

const AVAILABILITY_LABELS: Record<string, LocalizedText> = {
  in_showroom: { en: "In Showroom", hi: "शोरूम में", mr: "शोरूममध्ये" },
  made_to_order: { en: "Made to Order", hi: "ऑर्डर पर निर्मित", mr: "ऑर्डरनुसार बनवलेले" },
  reserved: { en: "Reserved", hi: "आरक्षित", mr: "राखीव" },
};

const NO_MAX: LocalizedText = { en: "No max", hi: "कोई अधिकतम नहीं", mr: "कमाल मर्यादा नाही" };

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** Row of removable pills summarizing every active filter — lets a shopper see (and undo) their exact filter state at a glance without opening the panel. */
export function ActiveFilterChips({
  categories,
  collections,
  locale = "en",
}: {
  categories: Category[];
  collections: Collection[];
  locale?: Locale;
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
      label: METAL_LABELS[metal]?.[locale] ?? metal,
      onRemove: () => clearFilter("metal"),
    });
  }

  for (const availability of filters.availabilities) {
    chips.push({
      key: `availability-${availability}`,
      label: AVAILABILITY_LABELS[availability]?.[locale] ?? availability,
      onRemove: () => clearFilter("availability"),
    });
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    chips.push({
      key: "price",
      label: `${filters.priceMin !== undefined ? formatINR(filters.priceMin) : "₹0"} – ${
        filters.priceMax !== undefined ? formatINR(filters.priceMax) : NO_MAX[locale]
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
      label: t("newArrivals", locale),
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
