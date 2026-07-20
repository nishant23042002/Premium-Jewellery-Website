import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/common/container";
import { cn } from "@/lib/utils";

/** Matches PageHero's shape (breadcrumb, eyebrow, title, description) so a route's loading.tsx doesn't jump-cut into the real hero once it resolves. */
export function PageHeroSkeleton({
  hasDescription = true,
  className,
}: {
  hasDescription?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("section border-b border-border", className)}>
      <Container>
        <Skeleton className="mb-6 h-3 w-40 shimmer rounded" />
        <Skeleton className="mb-3 h-3 w-24 shimmer rounded" />
        <Skeleton className="h-9 w-72 max-w-full shimmer rounded" />
        {hasDescription && (
          <Skeleton className="mt-5 h-4 w-96 max-w-full shimmer rounded" />
        )}
      </Container>
    </section>
  );
}
