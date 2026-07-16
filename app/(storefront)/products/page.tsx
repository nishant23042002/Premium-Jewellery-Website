import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductSort } from "@/components/storefront/product-sort";
import { DesktopFilterPanel } from "@/components/storefront/product-filters/desktop-filter-panel";
import { MobileFilterBar } from "@/components/storefront/product-filters/mobile-filter-bar";
import { ActiveFilterChips } from "@/components/storefront/product-filters/active-filter-chips";
import { ProductLoadMore } from "@/components/storefront/product-load-more";
import { PageHero } from "@/components/marketing/page-hero";
import { listCategories } from "@/features/categories/category.actions";
import { listCollections } from "@/features/collections/collection.actions";
import {
  listProducts,
  getBestSellerProductIds,
  getTrendingProductIds,
} from "@/features/products/product.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { parseProductFilters, type ProductSearchParams } from "@/lib/products/filter-params";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";
import type { LocalizedText } from "@/types/common";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "The full catalogue — every published piece, filterable by category, collection, metal, price, and more.",
  ...canonicalFor(ROUTES.products),
};

/** Page-local copy not in the shared dictionary — specific to this listing page's hero. */
const PRODUCTS_PAGE_COPY: Record<string, LocalizedText> = {
  title: { en: "All Products", hi: "सभी उत्पाद", mr: "सर्व उत्पादने" },
  description: {
    en: "Every published piece in our catalogue, with live pricing. Filter by collection, category, metal, price, and more to narrow things down.",
    hi: "हमारे कैटलॉग का हर प्रकाशित आभूषण, लाइव कीमत के साथ। इसे सीमित करने के लिए कलेक्शन, श्रेणी, धातु, कीमत और अधिक के अनुसार फ़िल्टर करें।",
    mr: "आमच्या कॅटलॉगमधील प्रत्येक प्रकाशित दागिना, लाइव्ह किंमतीसह. अचूक करण्यासाठी कलेक्शन, श्रेणी, धातू, किंमत आणि बरेच काही यानुसार फिल्टर करा.",
  },
  noProductsMatch: {
    en: "No products match these filters yet — try loosening a filter, or visit the showroom to see the full range in person.",
    hi: "अभी इन फ़िल्टर से कोई उत्पाद मेल नहीं खाता — कोई फ़िल्टर हटाकर देखें, या पूरी रेंज देखने के लिए शोरूम पर आएं।",
    mr: "सध्या या फिल्टर्सशी कोणतेही उत्पादन जुळत नाही — एखादे फिल्टर सैल करून पहा, किंवा संपूर्ण रेंज पाहण्यासाठी शोरूमला भेट द्या.",
  },
};

const PAGINATION_LABELS: Record<string, LocalizedText> = {
  previous: { en: "Previous", hi: "पिछला", mr: "मागील" },
  next: { en: "Next", hi: "अगला", mr: "पुढील" },
  page: { en: "Page", hi: "पृष्ठ", mr: "पान" },
  of: { en: "of", hi: "में से", mr: "पैकी" },
};

interface ProductsPageProps {
  searchParams: Promise<ProductSearchParams>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const rawParams = await searchParams;
  const filters = parseProductFilters(rawParams);

  const [categories, collections, locale] = await Promise.all([
    safeQuery(() => listCategories(), []),
    safeQuery(() => listCollections(), []),
    getStorefrontLocale(),
  ]);

  const categoryIds = filters.categorySlugs.length
    ? categories
        .filter((c) => filters.categorySlugs.includes(c.slug))
        .map((c) => c.id)
    : undefined;
  const collectionId = filters.collectionSlug
    ? collections.find((c) => c.slug === filters.collectionSlug)?.id
    : undefined;

  const result = await safeQuery(
    () =>
      listProducts({
        categoryIds,
        collectionId,
        metalTypes: filters.metalTypes.length ? filters.metalTypes : undefined,
        availabilities: filters.availabilities.length ? filters.availabilities : undefined,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        weightMin: filters.weightMin,
        weightMax: filters.weightMax,
        newArrivalOnly: filters.newArrivalOnly,
        page: filters.page,
        pageSize: 24,
        sort: filters.sort,
      }),
    { items: [], total: 0, page: 1, pageSize: 24, totalPages: 1 },
  );

  const [bestSellerIds, trendingIds] = await Promise.all([
    safeQuery(() => getBestSellerProductIds(), []),
    safeQuery(() => getTrendingProductIds(), []),
  ]);
  const bestSellerSet = new Set(bestSellerIds);
  const trendingSet = new Set(trendingIds);

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams(
      Object.entries(rawParams).flatMap(([k, v]) =>
        v === undefined ? [] : [[k, Array.isArray(v) ? v[0] : v] as [string, string]],
      ),
    );
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `${ROUTES.products}?${qs}` : ROUTES.products;
  };

  return (
    <>
      <PageHero
        eyebrow={t("shopEyebrow", locale)}
        title={PRODUCTS_PAGE_COPY.title[locale]}
        description={PRODUCTS_PAGE_COPY.description[locale]}
        breadcrumbs={[{ label: t("products", locale) }]}
        locale={locale}
      />

      <section className="section pt-0">
        <Container>
          <MobileFilterBar
            categories={categories}
            collections={collections}
            resultCount={result.total}
            locale={locale}
          />

          <div className="flex gap-8">
            <DesktopFilterPanel
              categories={categories}
              collections={collections}
              locale={locale}
            />

            <div className="min-w-0 flex-1">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <ActiveFilterChips
                  categories={categories}
                  collections={collections}
                  locale={locale}
                />
                <div className="ml-auto hidden items-center gap-3 lg:flex">
                  <span className="text-xs text-muted-foreground">
                    {result.total} {t("products", locale)}
                  </span>
                  <Suspense fallback={<div className="h-8 w-[190px]" />}>
                    <ProductSort locale={locale} />
                  </Suspense>
                </div>
              </div>

              {result.items.length > 0 ? (
                <>
                  <Grid cols={{ base: 2, sm: 3, xl: 4 }} gap="lg">
                    {result.items.map(({ product, price }) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        price={price}
                        locale={locale}
                        isBestSeller={bestSellerSet.has(product.id)}
                        isTrending={trendingSet.has(product.id)}
                      />
                    ))}
                  </Grid>

                  {result.totalPages > 1 && (
                    <>
                      <ProductLoadMore
                        baseParams={{
                          categoryIds,
                          collectionId,
                          metalTypes: filters.metalTypes.length ? filters.metalTypes : undefined,
                          availabilities: filters.availabilities.length
                            ? filters.availabilities
                            : undefined,
                          priceMin: filters.priceMin,
                          priceMax: filters.priceMax,
                          weightMin: filters.weightMin,
                          weightMax: filters.weightMax,
                          newArrivalOnly: filters.newArrivalOnly,
                          sort: filters.sort,
                        }}
                        startPage={result.page}
                        totalPages={result.totalPages}
                        bestSellerIds={bestSellerIds}
                        trendingIds={trendingIds}
                        locale={locale}
                      />

                      <div className="mt-6 flex items-center justify-center gap-3 border-t border-border pt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={filters.page <= 1}
                          nativeButton={false}
                          render={
                            <Link href={buildPageHref(filters.page - 1)}>
                              {PAGINATION_LABELS.previous[locale]}
                            </Link>
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {PAGINATION_LABELS.page[locale]} {result.page}{" "}
                          {PAGINATION_LABELS.of[locale]} {result.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={filters.page >= result.totalPages}
                          nativeButton={false}
                          render={
                            <Link href={buildPageHref(filters.page + 1)}>
                              {PAGINATION_LABELS.next[locale]}
                            </Link>
                          }
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    {PRODUCTS_PAGE_COPY.noProductsMatch[locale]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
