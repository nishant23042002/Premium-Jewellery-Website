import type { Metadata } from "next";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { CollectionCard } from "@/components/storefront/collection-card";
import { PageHero } from "@/components/marketing/page-hero";
import { listCategories } from "@/features/categories/category.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Browse our full catalogue by category — gold, diamond, silver, and antique jewellery.",
  ...canonicalFor(ROUTES.categories),
};

export default async function CategoriesPage() {
  const categories = await safeQuery(() => listCategories(), []);

  return (
    <>
      <PageHero
        eyebrow="Browse"
        title="Shop by Category"
        description="Every piece in our catalogue, organized the way our showroom is — by type, not by trend."
        breadcrumbs={[{ label: "Categories" }]}
      />

      <section className="section pt-0">
        <Container>
          {categories.length > 0 ? (
            <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap="lg">
              {categories.map((category) => (
                <CollectionCard
                  key={category.id}
                  item={category}
                  href={ROUTES.category(category.slug)}
                  eyebrow="Category"
                />
              ))}
            </Grid>
          ) : (
            <EmptyCategoriesState />
          )}
        </Container>
      </section>
    </>
  );
}

function EmptyCategoriesState() {
  return (
    <div className="rounded-2xl border border-dashed border-border py-16 text-center">
      <p className="text-sm text-muted-foreground">
        Categories are being added to the catalogue — check back shortly, or
        visit the showroom to browse in person.
      </p>
    </div>
  );
}
