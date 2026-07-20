import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";

export default function AccountReservationsLoading() {
  return (
    <>
      <PageHeroSkeleton hasDescription={false} />
      <section className="section pt-0">
        <Container className="max-w-3xl space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="size-14 shrink-0 shimmer rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 shimmer rounded" />
                  <Skeleton className="h-3 w-28 shimmer rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 shrink-0 shimmer rounded-full" />
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
