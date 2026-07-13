import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/skeletons/product-card-skeleton";

export default function CollectionDetailLoading() {
  return (
    <>
      <section className="section pt-0">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-4/3 w-full shimmer rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full shimmer rounded" />
            <Skeleton className="h-4 w-full shimmer rounded" />
            <Skeleton className="h-4 w-2/3 shimmer rounded" />
          </div>
        </Container>
      </section>
      <section className="section pt-0">
        <Container>
          <ProductGridSkeleton count={8} />
        </Container>
      </section>
    </>
  );
}
