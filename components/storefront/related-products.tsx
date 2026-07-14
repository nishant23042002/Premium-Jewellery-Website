import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { ProductCard } from "@/components/storefront/product-card";
import type { ProductWithPrice } from "@/features/products/product.actions";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

/** Same-category rail on the product detail page (Phase 5 "Related Products"). */
export function RelatedProducts({
  items,
  locale = "en",
}: {
  items: ProductWithPrice[];
  locale?: Locale;
}) {
  if (items.length === 0) return null;

  return (
    <section className="section bg-secondary/20 pt-0">
      <Container>
        <h2 className="mb-8 font-heading text-2xl">
          {t("youMayAlsoLike", locale)}
        </h2>
        <Grid cols={{ base: 2, lg: 4 }} gap="lg">
          {items.map(({ product, price }) => (
            <ProductCard
              key={product.id}
              product={product}
              price={price}
              locale={locale}
            />
          ))}
        </Grid>
      </Container>
    </section>
  );
}
