import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";

export default function CmsPageLoading() {
  return (
    <>
      <PageHeroSkeleton hasDescription={false} />
      <section className="section pt-0">
        <Container className="max-w-2xl space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-4 shimmer rounded ${i === 4 ? "w-2/3" : "w-full"}`}
            />
          ))}
        </Container>
      </section>
    </>
  );
}
