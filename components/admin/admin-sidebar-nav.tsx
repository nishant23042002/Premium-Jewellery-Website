"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_GROUPS } from "@/constants/admin-nav";

interface AdminSidebarNavProps {
  permissions: string[];
  onNavigate?: () => void;
}

export function AdminSidebarNav({
  permissions,
  onNavigate,
}: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5 overflow-y-auto px-3 py-4">
      {ADMIN_NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter(
          (item) => !item.permission || permissions.includes(item.permission),
        );
        if (visibleItems.length === 0) return null;

        return (
          <div key={group.label}>
            <p className="mb-1.5 px-2.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-gold/10 font-medium text-gold-dark"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
