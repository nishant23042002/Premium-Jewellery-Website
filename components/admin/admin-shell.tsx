"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Magnetic } from "@/components/motion/magnetic-button";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { ROUTES } from "@/constants/routes";
import { SITE } from "@/constants/site";
import type { SessionPayload } from "@/features/auth/admin-user.types";

interface AdminShellProps {
  session: SessionPayload;
  permissions: string[];
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}

/** Premium SaaS-style admin shell: fixed desktop sidebar, Sheet-based mobile nav, topbar with account/sign-out. */
export function AdminShell({
  session,
  permissions,
  logoutAction,
  children,
}: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/10">
      <aside
        data-lenis-prevent
        className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-background lg:flex"
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 font-heading text-sm">
          <LayoutDashboard className="size-4 text-gold" />
          {SITE.name}
        </div>
        <AdminSidebarNav permissions={permissions} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="size-4" />
                <span className="sr-only">Open navigation</span>
              </Button>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex h-14 items-center gap-2 border-b border-border px-4 font-heading text-sm">
                  <LayoutDashboard className="size-4 text-gold" />
                  {SITE.name}
                </div>
                <AdminSidebarNav
                  permissions={permissions}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <Link
              href={ROUTES.admin.dashboard}
              className="font-heading text-sm lg:hidden"
            >
              {SITE.name} Admin
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Magnetic strength={0.3}>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link
                    href={ROUTES.home}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5" />
                    <span className="hidden sm:inline">View Site</span>
                  </Link>
                }
              />
            </Magnetic>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {session.email}
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="size-3.5" />
                Sign Out
              </Button>
            </form>
          </div>
        </header>

        <main data-lenis-prevent className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
