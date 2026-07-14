"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Magnetic } from "@/components/motion/magnetic-button";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AdminLocaleToggle } from "@/components/admin/admin-locale-toggle";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { AdminNotificationsPopover } from "@/components/admin/admin-notifications-popover";
import {
  AdminCommandPalette,
  QUICK_CREATE,
} from "@/components/admin/admin-command-palette";
import { useAdminSidebarStore } from "@/store/zustand/use-admin-sidebar-store";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { SITE } from "@/constants/site";
import type { SessionPayload } from "@/features/auth/admin-user.types";
import type { AdminNotification } from "@/features/audit-logs/audit-log.actions";
import type { Locale } from "@/types/common";

interface AdminShellProps {
  session: SessionPayload;
  permissions: string[];
  logoutAction: () => Promise<void>;
  locale: Locale;
  notifications: AdminNotification[];
  children: React.ReactNode;
}

/** Premium SaaS-style admin shell: collapsible desktop sidebar, Sheet-based mobile nav, command palette, and a fuller topbar (quick-create, notifications, profile, theme). */
export function AdminShell({
  session,
  permissions,
  logoutAction,
  locale,
  notifications,
  children,
}: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const sidebarCollapsed = useAdminSidebarStore((s) => s.collapsed);

  // Notifications, alerts, and any other server-fetched data on this shell
  // stay close to live without a manual reload — see hooks/use-auto-refresh.
  useAutoRefresh(20_000);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const initial = session.email.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/10">
      <a
        href="#admin-main-content"
        className="focus-luxury sr-only rounded-lg bg-background px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100"
      >
        Skip to content
      </a>
      <aside
        data-lenis-prevent
        className={cn(
          "hidden shrink-0 flex-col overflow-y-auto border-r border-border bg-background transition-[width] duration-200 lg:flex",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2 border-b border-border font-heading text-sm",
            sidebarCollapsed ? "justify-center px-2" : "px-4",
          )}
        >
          <LayoutDashboard className="size-4 shrink-0 text-gold" />
          {!sidebarCollapsed && (
            <span className="truncate">{SITE.name}</span>
          )}
        </div>
        <AdminSidebarNav permissions={permissions} locale={locale} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
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
                  locale={locale}
                  onNavigate={() => setMobileNavOpen(false)}
                  allowCollapse={false}
                />
              </SheetContent>
            </Sheet>
            <Link
              href={ROUTES.admin.dashboard}
              className="truncate font-heading text-sm lg:hidden"
            >
              {SITE.name} Admin
            </Link>

            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="focus-luxury ml-1 hidden items-center gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold/30 hover:text-foreground sm:flex"
            >
              <Search className="size-3.5" />
              <span>Search or jump to...</span>
              <kbd className="ml-4 rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[0.65rem]">
                Ctrl K
              </kbd>
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="sm:hidden"
              aria-label="Search"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="size-4" />
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:inline-flex"
                  />
                }
              >
                <Plus className="size-3.5" />
                Create
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Quick create</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {QUICK_CREATE.map((action) => (
                    <DropdownMenuItem
                      key={action.href}
                      render={<Link href={action.href} />}
                    >
                      <Plus className="size-3.5" />
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label="Quick create"
              nativeButton={false}
              render={<Link href={ROUTES.admin.productNew} />}
            >
              <Plus className="size-4" />
            </Button>

            <AdminNotificationsPopover notifications={notifications} />

            <AdminLocaleToggle locale={locale} />
            <ThemeToggle />

            <Magnetic strength={0.3} className="hidden md:inline-block">
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
                    <span className="hidden lg:inline">View Site</span>
                  </Link>
                }
              />
            </Magnetic>

            <DropdownMenu>
              <DropdownMenuTrigger
                nativeButton
                render={
                  <button
                    type="button"
                    className="focus-luxury flex items-center gap-2 rounded-full"
                    aria-label="Account menu"
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-gold/15 text-gold-dark">
                    {initial || <User className="size-3.5" />}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="truncate">
                    {session.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    render={
                      <Link
                        href={ROUTES.home}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <ExternalLink className="size-3.5" />
                    View Site
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <form action={logoutAction}>
                  <DropdownMenuItem
                    variant="destructive"
                    nativeButton
                    render={<button type="submit" className="w-full" />}
                  >
                    <LogOut className="size-3.5" />
                    Sign Out
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main
          id="admin-main-content"
          data-lenis-prevent
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>

      <AdminCommandPalette
        permissions={permissions}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
    </div>
  );
}
