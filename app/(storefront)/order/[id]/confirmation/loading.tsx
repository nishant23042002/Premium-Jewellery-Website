import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderConfirmationLoading() {
  return (
    <section className="section">
      <Container className="max-w-lg text-center">
        <Skeleton className="mx-auto mb-4 size-12 shimmer rounded-full" />
        <Skeleton className="mx-auto h-7 w-56 shimmer rounded" />
        <Skeleton className="mx-auto mt-3 h-4 w-72 max-w-full shimmer rounded" />
        <div className="mt-8 space-y-3 rounded-2xl border border-border p-5 text-left">
          <Skeleton className="h-4 w-full shimmer rounded" />
          <Skeleton className="h-4 w-full shimmer rounded" />
          <Skeleton className="h-4 w-1/2 shimmer rounded" />
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Skeleton className="h-10 w-32 shimmer rounded" />
          <Skeleton className="h-10 w-40 shimmer rounded" />
        </div>
      </Container>
    </section>
  );
}
