import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

export default function AboutLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="section">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full shimmer rounded" />
            <Skeleton className="h-4 w-full shimmer rounded" />
            <Skeleton className="h-4 w-2/3 shimmer rounded" />
          </div>
          <Skeleton className="aspect-4/3 w-full shimmer rounded-2xl" />
        </Container>
      </section>
      <section className="section bg-secondary/20">
        <Container>
          <CardGridSkeleton count={4} cols={{ base: 1, sm: 2, lg: 4 }} aspect="aspect-square" lines={2} />
        </Container>
      </section>
    </>
  );
}
