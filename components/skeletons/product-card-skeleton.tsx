import { Skeleton } from "@/components/ui/skeleton";
import { Grid } from "@/components/common/grid";
import { cn } from "@/lib/utils";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Skeleton className="aspect-square w-full shimmer rounded-xl" />
      <Skeleton className="h-4 w-3/4 shimmer rounded" />
      <Skeleton className="h-4 w-1/2 shimmer rounded" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Grid>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </Grid>
  );
}
