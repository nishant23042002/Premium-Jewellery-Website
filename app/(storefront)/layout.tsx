import { SiteShell } from "@/components/layout/site-shell";

/** Public storefront shell (Navbar/Footer/BottomNav/ticker) — scoped to this route group so /admin gets its own chrome instead. */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
