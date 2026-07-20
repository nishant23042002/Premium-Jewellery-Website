import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";

export default function AccountOrderDetailLoading() {
  return (
    <>
      <PageHeroSkeleton hasDescription={false} />
      <section className="section pt-0">
        <Container className="max-w-3xl space-y-8">
          <div className="space-y-3 rounded-2xl border border-border/60 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-5 shrink-0 shimmer rounded-full" />
                <Skeleton className="h-4 w-40 shimmer rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-2xl border border-border/60 p-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="size-16 shrink-0 shimmer rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3 shimmer rounded" />
                  <Skeleton className="h-4 w-1/3 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-2xl border border-border/60 p-5">
            <Skeleton className="h-4 w-full shimmer rounded" />
            <Skeleton className="h-4 w-2/3 shimmer rounded" />
          </div>
        </Container>
      </section>
    </>
  );
}
