import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/**
 * Route-segment not-found for everything under /admin — without this, a
 * mistyped admin URL fell through to the plain storefront 404
 * ((storefront)/not-found.tsx, which is transparent to any URL not under
 * /admin or /api since route groups don't add a path segment) and looked
 * like a customer-facing page, wrong branding for someone in the admin panel.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <Compass className="size-10 text-gold" strokeWidth={1.5} aria-hidden />
      <h2 className="font-heading text-2xl">Page not found</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        There&apos;s nothing at this admin URL. It may have moved, or the
        link was mistyped.
      </p>
      <Button
        variant="gold"
        nativeButton={false}
        render={<Link href={ROUTES.admin.dashboard}>Back to Dashboard</Link>}
      />
    </div>
  );
}
