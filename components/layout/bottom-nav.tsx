"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, Store } from "lucide-react";
import { BOTTOM_NAV, ROUTES } from "@/constants";
import { useWishlistStore } from "@/store/zustand/use-wishlist-store";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types/common";

const ICONS = [Home, LayoutGrid, Heart, Store];

/** Mobile-only fixed bottom bar — the always-reachable primary nav on small screens (PRD §30). */
export function BottomNav({ locale = "en" }: { locale?: Locale }) {
  const pathname = usePathname();
  const wishlistCount = useWishlistStore((s) => s.productIds.length);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {BOTTOM_NAV.map((item, i) => {
        const Icon = ICONS[i] ?? Home;
        const isWishlist = item.href === ROUTES.wishlist;
        const isActive =
          item.href === ROUTES.home
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-0.5 text-[11px]",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {isWishlist && wishlistCount > 0 && (
              <span className="absolute -top-1 left-1/2 flex size-4 translate-x-1.5 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-gold-foreground">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
            {item.label[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
