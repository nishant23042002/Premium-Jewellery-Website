import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";

export default function CheckoutLoading() {
  return (
    <>
      <PageHeroSkeleton hasDescription={false} />
      <section className="section pt-0">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full shimmer rounded" />
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
