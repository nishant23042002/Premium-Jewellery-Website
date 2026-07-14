"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Phone, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LocaleToggle } from "@/components/common/locale-toggle";
import { FOOTER_NAV, PRIMARY_NAV, ROUTES, SITE } from "@/constants";
import { useUiStore } from "@/store/zustand/use-ui-store";
import { useWishlistStore } from "@/store/zustand/use-wishlist-store";
import { t } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import type { ReservationStatus } from "@/features/reservations/reservation.types";
import type { Locale } from "@/types/common";

/** pending/confirmed are the only statuses this ever receives (see getActiveReservationStatusForCustomer) — completed/cancelled don't need a persistent dot. */
const RESERVATION_DOT_COLOR: Partial<Record<ReservationStatus, string>> = {
  pending: "bg-amber-500",
  confirmed: "bg-gold",
};

/** Secondary discovery links surfaced below the primary nav (Discover + Support groups, minus duplicates already in PRIMARY_NAV). */
const MORE_LINKS = FOOTER_NAV.filter(
  (g) => g.heading.en !== "Legal" && g.heading.en !== "Shop",
)
  .flatMap((g) => g.items)
  .filter((item) => !PRIMARY_NAV.some((p) => p.href === item.href));

export function MobileNav({
  locale = "en",
  isSignedIn = false,
  reservationStatus = null,
}: {
  locale?: Locale;
  isSignedIn?: boolean;
  reservationStatus?: ReservationStatus | null;
}) {
  const isOpen = useUiStore((s) => s.isMobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const pathname = usePathname();
  const dotColor = reservationStatus
    ? RESERVATION_DOT_COLOR[reservationStatus]
    : undefined;

  function isRouteActive(href: string): boolean {
    return href === ROUTES.home
      ? pathname === ROUTES.home
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-[85vw] max-w-sm flex-col">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle className="font-heading">{SITE.name}</SheetTitle>
          <LocaleToggle locale={locale} />
        </SheetHeader>

        {/* Wishlist + Account move here from the header row (mobile only)
            so the site name has room to breathe. */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-1">
          <Link
            href={ROUTES.wishlist}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <Heart className="size-4" />
            {t("wishlist", locale)}
            {wishlistCount > 0 && (
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-gold-foreground">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href={ROUTES.account}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <span className="relative inline-flex">
              <User className="size-4" />
              {dotColor && (
                <span
                  className={`absolute -top-0.5 -right-0.5 size-2 rounded-full ${dotColor}`}
                />
              )}
            </span>
            {isSignedIn ? t("account", locale) : t("signIn", locale)}
          </Link>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto px-4">
          {PRIMARY_NAV.map((item) => {
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-3 text-base font-medium hover:bg-muted",
                  active
                    ? "bg-gold/10 text-gold-dark"
                    : "text-foreground",
                )}
              >
                {item.label[locale]}
              </Link>
            );
          })}

          <div className="mt-3 border-t border-border pt-3">
            <p className="px-3 pb-1 text-xs tracking-wide text-muted-foreground uppercase">
              {t("more", locale)}
            </p>
            {MORE_LINKS.map((item) => {
              const active = isRouteActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm hover:bg-muted hover:text-foreground",
                    active
                      ? "bg-gold/10 text-gold-dark"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label[locale]}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-2 px-4 pb-6">
          <Button
            variant="gold"
            nativeButton={false}
            render={
              <Link href={ROUTES.reservation} onClick={() => setOpen(false)}>
                {t("bookAVisit", locale)}
              </Link>
            }
          />
          <a
            href={`tel:${SITE.phone}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground"
          >
            <Phone className="size-4" />
            {t("callUs", locale)} {SITE.phoneDisplay}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
