import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { ProductCard } from "@/components/storefront/product-card";
import type { ProductWithPrice } from "@/features/products/product.actions";

/** Same-category rail on the product detail page (Phase 5 "Related Products"). */
export function RelatedProducts({ items }: { items: ProductWithPrice[] }) {
  if (items.length === 0) return null;

  return (
    <section className="section bg-secondary/20 pt-0">
      <Container>
        <h2 className="mb-8 font-heading text-2xl">You May Also Like</h2>
        <Grid cols={{ base: 2, lg: 4 }} gap="lg">
          {items.map(({ product, price }) => (
            <ProductCard key={product.id} product={product} price={price} />
          ))}
        </Grid>
      </Container>
    </section>
  );
}
