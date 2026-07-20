import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";

export default function BlogPostLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="section pt-0">
        <Container className="max-w-2xl">
          <Skeleton className="mb-10 aspect-16/9 w-full shimmer rounded-2xl" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`h-4 shimmer rounded ${i % 3 === 2 ? "w-2/3" : "w-full"}`}
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
