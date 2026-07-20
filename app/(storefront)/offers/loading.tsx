import { Container } from "@/components/common/container";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

export default function OffersLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="section pt-0">
        <Container>
          <CardGridSkeleton cols={{ base: 1, sm: 2, lg: 3 }} lines={3} />
        </Container>
      </section>
    </>
  );
}
