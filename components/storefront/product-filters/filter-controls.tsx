"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useProductFilters } from "@/hooks/use-product-filters";
import { VALID_AVAILABILITIES, VALID_METAL_TYPES } from "@/lib/products/filter-params";
import { formatINR } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
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

const PRICE_PRESETS: { label: LocalizedText; min: number | undefined; max: number | undefined }[] = [
  {
    label: { en: "Under ₹25,000", hi: "₹25,000 से कम", mr: "₹25,000 पेक्षा कमी" },
    min: undefined,
    max: 25000,
  },
  {
    label: { en: "₹25,000 – ₹75,000", hi: "₹25,000 – ₹75,000", mr: "₹25,000 – ₹75,000" },
    min: 25000,
    max: 75000,
  },
  {
    label: { en: "₹75,000 – ₹1,50,000", hi: "₹75,000 – ₹1,50,000", mr: "₹75,000 – ₹1,50,000" },
    min: 75000,
    max: 150000,
  },
  {
    label: { en: "Above ₹1,50,000", hi: "₹1,50,000 से ज़्यादा", mr: "₹1,50,000 पेक्षा जास्त" },
    min: 150000,
    max: undefined,
  },
];

const FILTER_CONTROLS_COPY: Record<string, LocalizedText> = {
  searchCategories: {
    en: "Search categories...",
    hi: "श्रेणियाँ खोजें...",
    mr: "श्रेण्या शोधा...",
  },
  noCategoriesMatch: {
    en: "No categories match",
    hi: "कोई श्रेणी मेल नहीं खाती",
    mr: "कोणतीही श्रेणी जुळत नाही",
  },
  to: { en: "to", hi: "से", mr: "ते" },
  noMax: { en: "No max", hi: "कोई अधिकतम नहीं", mr: "कमाल मर्यादा नाही" },
};

interface FilterControlsProps {
  categories: Category[];
  collections: Collection[];
  /** Sticky sidebar sections default open; the mobile sheet starts collapsed to save vertical space. */
  defaultOpenSections?: string[];
  locale?: Locale;
}

export function FilterControls({
  categories,
  collections,
  defaultOpenSections = ["collections", "categories", "price", "metal"],
  locale = "en",
}: FilterControlsProps) {
  const {
    filters,
    toggleCategory,
    setCollection,
    toggleMetalType,
    toggleAvailability,
    setPriceRange,
    setWeightRange,
    setNewArrivalOnly,
  } = useProductFilters();

  const [categoryQuery, setCategoryQuery] = useState("");

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories) {
      if (!c.parentId) continue;
      map.set(c.parentId, [...(map.get(c.parentId) ?? []), c]);
    }
    return map;
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return { roots: rootCategories, childrenByParent };
    // Flat search-inside-filters mode: match against every category by name,
    // regardless of parent/child, so a typed term always surfaces results.
    const matches = categories.filter((c) => c.name.en.toLowerCase().includes(q));
    return { roots: matches, childrenByParent: new Map<string, Category[]>() };
  }, [categoryQuery, categories, rootCategories, childrenByParent]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
        <Label htmlFor="new-arrival-filter" className="text-sm font-normal">
          {t("newArrivalsOnly", locale)}
        </Label>
        <Switch
          id="new-arrival-filter"
          checked={filters.newArrivalOnly}
          onCheckedChange={(checked) => setNewArrivalOnly(checked === true)}
        />
      </div>

      <Accordion defaultValue={defaultOpenSections}>
        {collections.length > 0 && (
          <AccordionItem value="collections">
            <AccordionTrigger>{t("collections", locale)}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {collections.map((collection) => (
                  <li key={collection.id}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={filters.collectionSlug === collection.slug}
                        onCheckedChange={() =>
                          setCollection(
                            filters.collectionSlug === collection.slug
                              ? undefined
                              : collection.slug,
                          )
                        }
                      />
                      <span className="text-muted-foreground">
                        {collection.name.en}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="categories">
          <AccordionTrigger>{t("categories", locale)}</AccordionTrigger>
          <AccordionContent>
            {categories.length > 6 && (
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder={FILTER_CONTROLS_COPY.searchCategories[locale]}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            )}
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredCategories.roots.map((category) => (
                <li key={category.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={filters.categorySlugs.includes(category.slug)}
                      onCheckedChange={() => toggleCategory(category.slug)}
                    />
                    <span className="text-muted-foreground">{category.name.en}</span>
                  </label>
                  {(filteredCategories.childrenByParent.get(category.id) ?? []).length >
                    0 && (
                    <ul className="mt-2 ml-6 space-y-2 border-l border-border pl-3">
                      {filteredCategories.childrenByParent
                        .get(category.id)!
                        .map((child) => (
                          <li key={child.id}>
                            <label className="flex cursor-pointer items-center gap-2 text-sm">
                              <Checkbox
                                checked={filters.categorySlugs.includes(child.slug)}
                                onCheckedChange={() => toggleCategory(child.slug)}
                              />
                              <span className="text-muted-foreground">
                                {child.name.en}
                              </span>
                            </label>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
              {filteredCategories.roots.length === 0 && (
                <li className="py-2 text-xs text-muted-foreground">
                  {FILTER_CONTROLS_COPY.noCategoriesMatch[locale]} &ldquo;{categoryQuery}
                  &rdquo;.
                </li>
              )}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger>{t("priceRange", locale)}</AccordionTrigger>
          <AccordionContent>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((preset) => {
                const active =
                  filters.priceMin === preset.min && filters.priceMax === preset.max;
                return (
                  <button
                    key={preset.label.en}
                    type="button"
                    onClick={() =>
                      setPriceRange(
                        active ? undefined : preset.min,
                        active ? undefined : preset.max,
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      active
                        ? "border-gold bg-gold/10 text-gold-dark"
                        : "border-border text-muted-foreground hover:border-gold/40",
                    )}
                  >
                    {preset.label[locale]}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={t("min", locale)}
                defaultValue={filters.priceMin ?? ""}
                onBlur={(e) =>
                  setPriceRange(
                    e.target.value ? Number(e.target.value) : undefined,
                    filters.priceMax,
                  )
                }
                className="h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">
                {FILTER_CONTROLS_COPY.to[locale]}
              </span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={t("max", locale)}
                defaultValue={filters.priceMax ?? ""}
                onBlur={(e) =>
                  setPriceRange(
                    filters.priceMin,
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="h-8 text-xs"
              />
            </div>
            {(filters.priceMin !== undefined || filters.priceMax !== undefined) && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {filters.priceMin !== undefined ? formatINR(filters.priceMin) : "₹0"}
                {" – "}
                {filters.priceMax !== undefined
                  ? formatINR(filters.priceMax)
                  : FILTER_CONTROLS_COPY.noMax[locale]}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="metal">
          <AccordionTrigger>{t("metalType", locale)}</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {VALID_METAL_TYPES.map((metal) => (
                <li key={metal}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={filters.metalTypes.includes(metal)}
                      onCheckedChange={() => toggleMetalType(metal)}
                    />
                    <span className="text-muted-foreground">
                      {METAL_LABELS[metal][locale]}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="weight">
          <AccordionTrigger>{t("weightGrams", locale)}</AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={t("min", locale)}
                defaultValue={filters.weightMin ?? ""}
                onBlur={(e) =>
                  setWeightRange(
                    e.target.value ? Number(e.target.value) : undefined,
                    filters.weightMax,
                  )
                }
                className="h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">
                {FILTER_CONTROLS_COPY.to[locale]}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={t("max", locale)}
                defaultValue={filters.weightMax ?? ""}
                onBlur={(e) =>
                  setWeightRange(
                    filters.weightMin,
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="h-8 text-xs"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="availability">
          <AccordionTrigger>{t("availability", locale)}</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {VALID_AVAILABILITIES.map((availability) => (
                <li key={availability}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={filters.availabilities.includes(availability)}
                      onCheckedChange={() => toggleAvailability(availability)}
                    />
                    <span className="text-muted-foreground">
                      {AVAILABILITY_LABELS[availability][locale]}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

/** Small "X selected, clear" footer shown under the filter controls in both desktop and mobile layouts. */
export function ClearAllButton({
  onClear,
  locale = "en",
}: {
  onClear: () => void;
  locale?: Locale;
}) {
  return (
    <Button variant="ghost" size="sm" className="w-full" onClick={onClear}>
      <X className="size-3.5" />
      {t("clearAllFilters", locale)}
    </Button>
  );
}
