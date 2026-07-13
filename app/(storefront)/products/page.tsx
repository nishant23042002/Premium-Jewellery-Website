import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductSort } from "@/components/storefront/product-sort";
import { PageHero } from "@/components/marketing/page-hero";
import {
  listCategories,
  getCategoryBySlug,
} from "@/features/categories/category.actions";
import {
  listProducts,
  type ProductSort as ProductSortValue,
} from "@/features/products/product.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { Product } from "@/features/products/product.types";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "The full catalogue — every published piece, filterable by category and metal.",
  ...canonicalFor(ROUTES.products),
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    metal?: string;
    page?: string;
    sort?: string;
  }>;
}

const METAL_FILTERS: { label: string; value: Product["metalType"] }[] = [
  { label: "Gold", value: "gold" },
  { label: "Diamond", value: "diamond" },
  { label: "Silver", value: "silver" },
];

const VALID_SORTS: ProductSortValue[] = [
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
];

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const {
    category: categorySlug,
    metal,
    page: pageParam,
    sort: sortParam,
  } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const sort = VALID_SORTS.includes(sortParam as ProductSortValue)
    ? (sortParam as ProductSortValue)
    : "newest";

  const [categories, activeCategory] = await Promise.all([
    safeQuery(() => listCategories(), []),
    categorySlug
      ? safeQuery(() => getCategoryBySlug(categorySlug), null)
      : Promise.resolve(null),
  ]);

  const metalType = METAL_FILTERS.find((m) => m.value === metal)?.value;

  const result = await safeQuery(
    () =>
      listProducts({
        categoryId: activeCategory?.id,
        metalType,
        page,
        pageSize: 24,
        sort,
      }),
    { items: [], total: 0, page: 1, pageSize: 24, totalPages: 1 },
  );

  const buildHref = (next: {
    category?: string;
    metal?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    const category = "category" in next ? next.category : categorySlug;
    const m = "metal" in next ? next.metal : metal;
    if (category) params.set("category", category);
    if (m) params.set("metal", m);
    if (sort !== "newest") params.set("sort", sort);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return qs ? `${ROUTES.products}?${qs}` : ROUTES.products;
  };

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="All Products"
        description="Every published piece in our catalogue, with live pricing. Filter by category or metal to narrow things down."
        breadcrumbs={[{ label: "Products" }]}
      />

      <section className="section pt-0">
        <Container>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <FilterChip href={ROUTES.products} active={!categorySlug}>
                All Categories
              </FilterChip>
              {categories.map((c) => (
                <FilterChip
                  key={c.id}
                  href={buildHref({ category: c.slug })}
                  active={categorySlug === c.slug}
                >
                  {c.name.en}
                </FilterChip>
              ))}
              <span className="mx-2 h-4 w-px bg-border" aria-hidden />
              <FilterChip
                href={buildHref({ metal: undefined })}
                active={!metal}
              >
                Any Metal
              </FilterChip>
              {METAL_FILTERS.map((m) => (
                <FilterChip
                  key={m.value}
                  href={buildHref({ metal: m.value })}
                  active={metal === m.value}
                >
                  {m.label}
                </FilterChip>
              ))}
            </div>

            <Suspense fallback={<div className="h-8 w-[190px]" />}>
              <ProductSort value={sort} />
            </Suspense>
          </div>

          {result.items.length > 0 ? (
            <>
              <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap="lg">
                {result.items.map(({ product, price }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    price={price}
                  />
                ))}
              </Grid>

              {result.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    nativeButton={false}
                    render={
                      <Link href={buildHref({ page: page - 1 })}>Previous</Link>
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    Page {result.page} of {result.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= result.totalPages}
                    nativeButton={false}
                    render={
                      <Link href={buildHref({ page: page + 1 })}>Next</Link>
                    }
                  />
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No products match this filter yet — try a different category, or
                visit the showroom to see the full range in person.
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Badge
        variant={active ? "gold" : "outline"}
        className={cn(
          "cursor-pointer px-3 py-1.5 text-xs",
          !active && "hover:bg-muted",
        )}
      >
        {children}
      </Badge>
    </Link>
  );
}
