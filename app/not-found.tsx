import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/**
 * Root-level fallback — in practice (storefront)/not-found.tsx already
 * catches everything outside /admin and /api, since route groups don't add
 * a URL segment, so this rarely renders. It exists as the ultimate
 * catch-all Next.js falls back to if no more specific not-found boundary
 * matches, kept dependency-light on purpose (same reasoning as
 * app/global-error.tsx) since it may render in situations where more of
 * the app has failed to resolve.
 */
export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-heading text-6xl text-gold">404</p>
      <h1 className="font-heading text-2xl">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Button
        variant="gold"
        nativeButton={false}
        render={<Link href={ROUTES.home}>Back to Home</Link>}
      />
    </div>
  );
}
