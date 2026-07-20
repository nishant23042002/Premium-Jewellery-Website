import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";

export default function FaqLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="section">
        <Container>
          <div className="mx-auto max-w-2xl space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full shimmer rounded-xl" />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
