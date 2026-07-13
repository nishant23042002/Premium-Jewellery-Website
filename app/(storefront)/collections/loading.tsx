import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionsLoading() {
  return (
    <section className="section pt-0">
      <Container className="space-y-20">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid items-center gap-10 lg:grid-cols-2">
            <Skeleton
              className={
                "aspect-4/3 w-full shimmer rounded-2xl " +
                (i % 2 === 1 ? "lg:order-2" : "")
              }
            />
            <div className="space-y-3">
              <Skeleton className="h-3 w-24 shimmer rounded" />
              <Skeleton className="h-8 w-2/3 shimmer rounded" />
              <Skeleton className="h-4 w-full shimmer rounded" />
              <Skeleton className="h-4 w-4/5 shimmer rounded" />
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}
