import { Container } from "@/components/common/container";
import { ProductGridSkeleton } from "@/components/skeletons/product-card-skeleton";

export default function ProductsLoading() {
  return (
    <section className="section pt-0">
      <Container>
        <ProductGridSkeleton count={12} />
      </Container>
    </section>
  );
}
