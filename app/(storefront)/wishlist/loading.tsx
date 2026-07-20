import { Container } from "@/components/common/container";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";
import { ProductGridSkeleton } from "@/components/skeletons/product-card-skeleton";

export default function WishlistLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="section pt-0">
        <Container>
          <ProductGridSkeleton count={4} />
        </Container>
      </section>
    </>
  );
}
