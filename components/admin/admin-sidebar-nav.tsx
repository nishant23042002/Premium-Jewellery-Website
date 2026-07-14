"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_NAV_GROUPS,
  ALL_ADMIN_NAV_ITEMS,
  type AdminNavItem,
} from "@/constants/admin-nav";
import { useAdminSidebarStore } from "@/store/zustand/use-admin-sidebar-store";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { translateAdminNavLabel } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

interface AdminSidebarNavProps {
  permissions: string[];
  locale?: Locale;
  onNavigate?: () => void;
  /** False inside the mobile Sheet — rail-collapse doesn't make sense in a drawer. */
  allowCollapse?: boolean;
}

function isVisible(item: AdminNavItem, permissions: string[]) {
  return !item.permission || permissions.includes(item.permission);
}

function NavRow({
  item,
  active,
  favorited,
  onToggleFavorite,
  onNavigate,
  collapsed,
  locale,
}: {
  item: AdminNavItem;
  active: boolean;
  favorited: boolean;
  onToggleFavorite: () => void;
  onNavigate?: () => void;
  collapsed: boolean;
  locale: Locale;
}) {
  const Icon = item.icon;
  const label = translateAdminNavLabel(item.label, locale);

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
        collapsed && "justify-center px-0 py-2",
        active
          ? "bg-gold/10 font-medium text-gold-dark"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div className="px-1.5">{link}</div>} />
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="group/row flex items-center gap-0.5">
      {link}
      <button
        type="button"
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={favorited}
        onClick={onToggleFavorite}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:text-gold-dark",
          favorited
            ? "opacity-100 text-gold-dark"
            : "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100",
        )}
      >
        <Star className={cn("size-3.5", favorited && "fill-current")} />
      </button>
    </div>
  );
}

export function AdminSidebarNav({
  permissions,
  locale = "en",
  onNavigate,
  allowCollapse = true,
}: AdminSidebarNavProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const storeCollapsed = useAdminSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useAdminSidebarStore((s) => s.toggleCollapsed);
  const collapsedGroups = useAdminSidebarStore((s) => s.collapsedGroups);
  const toggleGroup = useAdminSidebarStore((s) => s.toggleGroup);
  const favorites = useAdminSidebarStore((s) => s.favorites);
  const toggleFavorite = useAdminSidebarStore((s) => s.toggleFavorite);
  const recents = useAdminSidebarStore((s) => s.recents);
  const trackVisit = useAdminSidebarStore((s) => s.trackVisit);

  const collapsed = allowCollapse && storeCollapsed;

  useEffect(() => {
    trackVisit(pathname);
    // Only re-run when the route actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const favoriteItems = useMemo(
    () =>
      ALL_ADMIN_NAV_ITEMS.filter(
        (item) => favorites.includes(item.href) && isVisible(item, permissions),
      ),
    [favorites, permissions],
  );

  const recentItems = useMemo(
    () =>
      recents
        .filter((href) => href !== pathname)
        .map((href) => ALL_ADMIN_NAV_ITEMS.find((item) => item.href === href))
        .filter((item): item is AdminNavItem => !!item && isVisible(item, permissions))
        .slice(0, 4),
    [recents, pathname, permissions],
  );

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return ALL_ADMIN_NAV_ITEMS.filter(
      (item) => isVisible(item, permissions) && item.label.toLowerCase().includes(q),
    );
  }, [query, permissions]);

  if (collapsed) {
    return (
      <nav className="flex flex-col items-center gap-1 overflow-y-auto px-1.5 py-4">
        {ADMIN_NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            isVisible(item, permissions),
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="flex w-full flex-col gap-1 border-t border-border/60 pt-1.5 first:border-t-0 first:pt-0">
              {visibleItems.map((item) => (
                <NavRow
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  favorited={favorites.includes(item.href)}
                  onToggleFavorite={() => toggleFavorite(item.href)}
                  onNavigate={onNavigate}
                  collapsed
                  locale={locale}
                />
              ))}
            </div>
          );
        })}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="Expand sidebar"
          className="mt-2 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <PanelLeftOpen className="size-4" />
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-4 overflow-y-auto px-3 py-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search navigation..."
          className="h-8 pl-8"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {query.trim() ? (
        <div>
          <p className="mb-1.5 px-2.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
            {searchResults.length === 0
              ? "No matches"
              : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`}
          </p>
          <div className="space-y-0.5">
            {searchResults.map((item) => (
              <NavRow
                key={item.href}
                item={item}
                active={isActive(item.href)}
                favorited={favorites.includes(item.href)}
                onToggleFavorite={() => toggleFavorite(item.href)}
                onNavigate={onNavigate}
                collapsed={false}
                locale={locale}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {favoriteItems.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 px-2.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                <Star className="size-3 fill-current text-gold-dark" />
                Favorites
              </p>
              <div className="space-y-0.5">
                {favoriteItems.map((item) => (
                  <NavRow
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    favorited
                    onToggleFavorite={() => toggleFavorite(item.href)}
                    onNavigate={onNavigate}
                    collapsed={false}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          )}

          {recentItems.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 px-2.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                <Clock className="size-3" />
                Recent
              </p>
              <div className="space-y-0.5">
                {recentItems.map((item) => (
                  <NavRow
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    favorited={favorites.includes(item.href)}
                    onToggleFavorite={() => toggleFavorite(item.href)}
                    onNavigate={onNavigate}
                    collapsed={false}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          )}

          {ADMIN_NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) =>
              isVisible(item, permissions),
            );
            if (visibleItems.length === 0) return null;
            const isGroupCollapsed = collapsedGroups.includes(group.label);

            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="mb-1.5 flex w-full items-center justify-between px-2.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
                  aria-expanded={!isGroupCollapsed}
                >
                  {translateAdminNavLabel(group.label, locale)}
                  <ChevronDown
                    className={cn(
                      "size-3 transition-transform duration-200",
                      isGroupCollapsed && "-rotate-90",
                    )}
                  />
                </button>
                {!isGroupCollapsed && (
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => (
                      <NavRow
                        key={item.href}
                        item={item}
                        active={isActive(item.href)}
                        favorited={favorites.includes(item.href)}
                        onToggleFavorite={() => toggleFavorite(item.href)}
                        onNavigate={onNavigate}
                        collapsed={false}
                        locale={locale}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {allowCollapse && (
        <button
          type="button"
          onClick={toggleCollapsed}
          className="mt-auto flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <PanelLeftClose className="size-4" />
          Collapse sidebar
        </button>
      )}
    </nav>
  );
}
