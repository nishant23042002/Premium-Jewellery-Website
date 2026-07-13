"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route-segment error boundary. Next.js renders this in place of the
 * segment that threw, keeping the rest of the shell (nav/footer) intact.
 */
export default function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden />
      <h2 className="font-heading text-2xl">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        We couldn&apos;t load this page. Please try again, or call the showroom
        directly if the problem continues.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
