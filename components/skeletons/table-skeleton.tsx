import { Skeleton } from "@/components/ui/skeleton";

/** Admin data-table loading state (TanStack Table screens). */
export function TableSkeleton({
  rows = 6,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="w-full space-y-2">
      <Skeleton className="h-9 w-full shimmer rounded-md" />
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-10 flex-1 shimmer rounded-md"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
