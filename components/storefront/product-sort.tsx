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
import type { Locale, LocalizedText } from "@/types/common";

export const SORT_OPTIONS: { value: ProductSortValue; label: LocalizedText }[] = [
  {
    value: "newest",
    label: { en: "Newest Arrivals", hi: "नई आवक सबसे पहले", mr: "नवीन आगमन आधी" },
  },
  {
    value: "popularity",
    label: { en: "Popularity", hi: "लोकप्रियता", mr: "लोकप्रियता" },
  },
  {
    value: "name_asc",
    label: {
      en: "Alphabetically: A to Z",
      hi: "वर्णानुक्रम: A से Z",
      mr: "वर्णानुक्रमे: A ते Z",
    },
  },
  {
    value: "price_asc",
    label: { en: "Price: Low to High", hi: "कीमत: कम से ज़्यादा", mr: "किंमत: कमी ते जास्त" },
  },
  {
    value: "price_desc",
    label: { en: "Price: High to Low", hi: "कीमत: ज़्यादा से कम", mr: "किंमत: जास्त ते कमी" },
  },
  {
    value: "weight_asc",
    label: { en: "Weight: Low to High", hi: "वज़न: कम से ज़्यादा", mr: "वजन: कमी ते जास्त" },
  },
  {
    value: "weight_desc",
    label: { en: "Weight: High to Low", hi: "वज़न: ज़्यादा से कम", mr: "वजन: जास्त ते कमी" },
  },
  {
    value: "most_viewed",
    label: { en: "Most Viewed", hi: "सबसे ज़्यादा देखे गए", mr: "सर्वाधिक पाहिलेले" },
  },
  {
    value: "most_reserved",
    label: { en: "Most Reserved", hi: "सबसे ज़्यादा आरक्षित", mr: "सर्वाधिक राखीव" },
  },
];

/** Sort control for the Products catalogue — reads/writes the `sort` query param via the shared filter hook, page resets to 1. */
export function ProductSort({ locale = "en" }: { locale?: Locale }) {
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
            {option.label[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
