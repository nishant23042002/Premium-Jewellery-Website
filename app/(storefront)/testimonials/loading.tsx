import { Container } from "@/components/common/container";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

/** Real PageHero here has no description prop, but shows a rating line via children — hasDescription=false is closest without inventing a phantom line. */
export default function TestimonialsLoading() {
  return (
    <>
      <PageHeroSkeleton hasDescription={false} />
      <section className="section pt-0">
        <Container>
          <CardGridSkeleton cols={{ base: 1, sm: 2, lg: 3 }} lines={3} />
        </Container>
      </section>
    </>
  );
}
