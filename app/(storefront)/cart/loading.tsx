import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";

export default function CartLoading() {
  return (
    <>
      <PageHeroSkeleton hasDescription={false} />
      <section className="section pt-0">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="size-20 shrink-0 shimmer rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3 shimmer rounded" />
                    <Skeleton className="h-4 w-1/3 shimmer rounded" />
                    <Skeleton className="h-4 w-1/4 shimmer rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-fit space-y-3 rounded-2xl border border-border p-5">
              <Skeleton className="h-5 w-32 shimmer rounded" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full shimmer rounded" />
              ))}
              <Skeleton className="h-10 w-full shimmer rounded" />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
