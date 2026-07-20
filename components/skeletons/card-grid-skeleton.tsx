import { Skeleton } from "@/components/ui/skeleton";
import { Grid } from "@/components/common/grid";
import { cn } from "@/lib/utils";

/** One image-topped card shape — reused by CardGridSkeleton for any page whose loading state is "a grid of photo cards" (blog, events, gallery, testimonials, offers). */
function GridCardSkeleton({
  aspect = "aspect-4/3",
  lines = 2,
}: {
  aspect?: string;
  lines?: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className={cn(aspect, "w-full shimmer rounded-xl")} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4 shimmer rounded", i === lines - 1 ? "w-1/2" : "w-full")}
        />
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  cols = { base: 1, sm: 2, lg: 3 },
  aspect,
  lines,
}: {
  count?: number;
  cols?: { base: number; sm?: number; lg?: number };
  aspect?: string;
  lines?: number;
}) {
  return (
    <Grid cols={cols} gap="lg">
      {Array.from({ length: count }).map((_, i) => (
        <GridCardSkeleton key={i} aspect={aspect} lines={lines} />
      ))}
    </Grid>
  );
}
