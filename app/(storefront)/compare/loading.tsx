import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";

export default function CompareLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="section pt-0">
        <Container>
          <div className="overflow-x-auto">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-32 shrink-0 shimmer rounded" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-48 shrink-0 shimmer rounded-xl" />
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full shimmer rounded" />
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
