import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

/** Homepage has no PageHero — it opens with a full-bleed HeroCarousel, so this mirrors that shape instead. */
export default function HomeLoading() {
  return (
    <>
      <Skeleton className="mx-auto my-1 aspect-4/5 w-[95%] shimmer rounded-md sm:aspect-14/6" />
      <section className="section">
        <Container>
          <CardGridSkeleton count={3} cols={{ base: 1, sm: 3 }} aspect="aspect-4/5" lines={1} />
        </Container>
      </section>
      <section className="section border-t border-border bg-secondary/20">
        <Container>
          <CardGridSkeleton count={8} cols={{ base: 2, lg: 4 }} lines={2} />
        </Container>
      </section>
    </>
  );
}
