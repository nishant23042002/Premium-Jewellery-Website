"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/**
 * Route-segment error boundary for everything under /admin. Mirrors
 * app/error.tsx's pattern — without this, an error here would bubble up to
 * the storefront's root boundary and lose the "you're in the admin panel"
 * context (dashboard link instead of storefront nav).
 */
export default function AdminError({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden />
      <h2 className="font-heading text-2xl">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        This admin page hit an error. Try again, or head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href={ROUTES.admin.dashboard}>Dashboard</a>}
        />
      </div>
    </div>
  );
}
