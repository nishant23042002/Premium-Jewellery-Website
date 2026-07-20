import { Container } from "@/components/common/container";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

export default function HallmarkLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="section">
        <Container>
          <CardGridSkeleton count={4} cols={{ base: 2, lg: 4 }} aspect="aspect-square" lines={2} />
        </Container>
      </section>
    </>
  );
}
