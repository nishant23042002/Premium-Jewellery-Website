import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";

export default function SignupLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="section pt-0">
        <Container className="max-w-md">
          <div className="space-y-4 rounded-2xl border border-border p-6">
            <Skeleton className="h-10 w-full shimmer rounded" />
            <Skeleton className="h-10 w-full shimmer rounded" />
            <Skeleton className="h-10 w-full shimmer rounded" />
            <Skeleton className="h-10 w-full shimmer rounded" />
            <Skeleton className="h-10 w-full shimmer rounded" />
          </div>
        </Container>
      </section>
    </>
  );
}
