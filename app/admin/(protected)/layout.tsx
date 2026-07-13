import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSession } from "@/lib/auth/session";
import { getSessionPermissions } from "@/lib/auth/permissions";
import { logoutAction } from "@/features/auth/auth.actions";
import { ROUTES } from "@/constants/routes";

/**
 * Admin shell — deliberately outside the (storefront) route group, so it
 * never inherits the public Navbar/Footer/BottomNav. Middleware already
 * blocks unauthenticated requests to anything under /admin except
 * /admin/login, so `getSession()` here is for display (who's signed in) and
 * for resolving the sidebar's permission-gated nav — not the actual gate —
 * but we still redirect defensively if it's somehow missing (e.g. a race
 * right after logout).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect(ROUTES.admin.login);

  const permissions = await getSessionPermissions(session);

  return (
    <AdminShell
      session={session}
      permissions={permissions}
      logoutAction={logoutAction}
    >
      {children}
    </AdminShell>
  );
}
