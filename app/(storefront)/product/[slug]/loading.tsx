import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <Container className="pt-8 pb-16">
      <Skeleton className="mb-6 h-4 w-56 shimmer rounded" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-square w-full shimmer rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4 shimmer rounded" />
          <Skeleton className="h-4 w-1/3 shimmer rounded" />
          <Skeleton className="h-10 w-1/2 shimmer rounded" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full shimmer rounded" />
            <Skeleton className="h-4 w-full shimmer rounded" />
            <Skeleton className="h-4 w-2/3 shimmer rounded" />
          </div>
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-11 w-40 shimmer rounded-xl" />
            <Skeleton className="h-11 w-40 shimmer rounded-xl" />
          </div>
        </div>
      </div>
    </Container>
  );
}
