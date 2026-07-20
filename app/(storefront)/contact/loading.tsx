import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";

export default function ContactLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="section pt-0">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="mt-0.5 size-5 shrink-0 shimmer rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-16 shimmer rounded" />
                  <Skeleton className="h-4 w-40 shimmer rounded" />
                </div>
              </div>
            ))}
            <Skeleton className="aspect-4/3 w-full shimmer rounded-2xl" />
          </div>
          <div className="space-y-4 rounded-2xl border border-border/60 p-6">
            <Skeleton className="h-6 w-40 shimmer rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full shimmer rounded" />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
