import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  label?: string;
}

/** Brand loading indicator — a slow-pulsing gold ring, restrained rather than a spinner (PRD Phase 2 "Loading Animations"). */
export function Loader({ className, label = "Loading" }: LoaderProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-gold" />
      <span className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}
