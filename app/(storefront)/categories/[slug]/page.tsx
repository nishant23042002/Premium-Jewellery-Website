import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "next-seo";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { ProductCard } from "@/components/storefront/product-card";
import { PageHero } from "@/components/marketing/page-hero";
import { getCategoryBySlug } from "@/features/categories/category.actions";
import { listProducts } from "@/features/products/product.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { siteConfig } from "@/config/site.config";
import { ROUTES } from "@/constants/routes";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await safeQuery(() => getCategoryBySlug(slug), null);
  if (!category) return { title: "Category" };
  return {
    title: category.name.en,
    description: `Shop the ${category.name.en} collection — live, transparent pricing on every piece.`,
    ...canonicalFor(ROUTES.category(category.slug)),
  };
}

export default async function CategoryDetailPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;
  const category = await safeQuery(() => getCategoryBySlug(slug), null);

  if (!category) notFound();

  const products = await safeQuery(
    () => listProducts({ categoryId: category.id, pageSize: 24 }),
    { items: [], total: 0, page: 1, pageSize: 24, totalPages: 1 },
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", item: siteConfig.url },
          { name: "Categories", item: `${siteConfig.url}${ROUTES.categories}` },
          { name: category.name.en },
        ]}
      />
      <PageHero
        eyebrow="Category"
        title={category.name.en}
        breadcrumbs={[
          { label: "Categories", href: ROUTES.categories },
          { label: category.name.en },
        ]}
      />

      <section className="section pt-0">
        <Container>
          {products.items.length > 0 ? (
            <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap="lg">
              {products.items.map(({ product, price }) => (
                <ProductCard key={product.id} product={product} price={price} />
              ))}
            </Grid>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No pieces in this category are published online yet — visit the
                showroom to see what&apos;s in stock today.
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
