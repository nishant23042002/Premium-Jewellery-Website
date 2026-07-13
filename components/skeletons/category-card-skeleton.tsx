import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Skeleton className="aspect-4/5 w-full shimmer rounded-2xl" />
      <Skeleton className="mx-auto h-4 w-2/3 shimmer rounded" />
    </div>
  );
}
