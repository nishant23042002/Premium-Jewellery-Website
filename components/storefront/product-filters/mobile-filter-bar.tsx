"use client";

import { useState } from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterControls, ClearAllButton } from "@/components/storefront/product-filters/filter-controls";
import { useProductFilters } from "@/hooks/use-product-filters";
import { countActiveFilters } from "@/lib/products/filter-params";
import { SORT_OPTIONS } from "@/components/storefront/product-sort";
import type { Category } from "@/features/categories/category.types";
import type { Collection } from "@/features/collections/collection.types";

/**
 * Mobile-only sticky Filter/Sort trigger row (`lg:hidden`) — Filter opens a
 * bottom sheet with the same controls as the desktop sidebar; Sort opens a
 * lightweight native-feeling select. Both live in one component so they can
 * share the sticky positioning and active-filter count badge.
 */
export function MobileFilterBar({
  categories,
  collections,
  resultCount,
}: {
  categories: Category[];
  collections: Collection[];
  resultCount: number;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const { filters, isPending, clearAll, setSort } = useProductFilters();
  const activeCount = countActiveFilters(filters);

  return (
    <div className="sticky top-[calc(var(--header-height,0px))] z-30 -mx-4 flex items-center gap-2 border-y border-border bg-background/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => setFilterOpen(true)}
      >
        <SlidersHorizontal className="size-3.5" />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 rounded-full bg-gold/15 px-1.5 text-[0.65rem] font-medium text-gold-dark">
            {activeCount}
          </span>
        )}
      </Button>

      <Select value={filters.sort} onValueChange={(v) => v && setSort(v as typeof filters.sort)}>
        <SelectTrigger size="sm" className="flex-1">
          <ArrowUpDown className="size-3.5" />
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

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="flex max-h-[85vh] flex-col p-0">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="mb-3 text-xs text-muted-foreground">
              {isPending ? "Updating…" : `${resultCount} results`}
            </p>
            <FilterControls
              categories={categories}
              collections={collections}
              defaultOpenSections={[]}
            />
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-border">
            {activeCount > 0 && (
              <div className="flex-1">
                <ClearAllButton onClear={clearAll} />
              </div>
            )}
            <Button
              variant="gold"
              className="flex-1"
              onClick={() => setFilterOpen(false)}
            >
              Show {resultCount} Results
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
