"use client";

import { FilterControls, ClearAllButton } from "@/components/storefront/product-filters/filter-controls";
import { useProductFilters } from "@/hooks/use-product-filters";
import { countActiveFilters } from "@/lib/products/filter-params";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/dictionary";
import type { Category } from "@/features/categories/category.types";
import type { Collection } from "@/features/collections/collection.types";
import type { Locale } from "@/types/common";

/** Desktop-only sticky sidebar — hidden below `lg`, where the mobile bottom-sheet takes over (see MobileFilterBar). */
export function DesktopFilterPanel({
  categories,
  collections,
  locale = "en",
}: {
  categories: Category[];
  collections: Collection[];
  locale?: Locale;
}) {
  const { filters, isPending, clearAll } = useProductFilters();
  const activeCount = countActiveFilters(filters);

  return (
    <aside
      className={cn(
        "hidden lg:sticky lg:top-24 lg:block lg:h-fit lg:w-64 lg:shrink-0 lg:self-start",
        "transition-opacity duration-200",
        isPending && "opacity-60",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{t("filters", locale)}</p>
        {activeCount > 0 && (
          <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold-dark">
            {activeCount} active
          </span>
        )}
      </div>
      <FilterControls categories={categories} collections={collections} locale={locale} />
      {activeCount > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <ClearAllButton onClear={clearAll} locale={locale} />
        </div>
      )}
    </aside>
  );
}
