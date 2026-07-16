"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/container";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { LocaleToggle } from "@/components/common/locale-toggle";
import { Magnetic } from "@/components/motion/magnetic-button";
import { MegaMenu } from "@/components/layout/mega-menu";
import { HeaderAccountControl } from "@/components/storefront/header-account-control";
import { HeaderSearch } from "@/components/storefront/header-search";
import { PRIMARY_NAV, ROUTES, SITE } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/store/redux/hooks";
import { setActiveMegaMenu } from "@/store/redux/slices/ui-slice";
import { useUiStore } from "@/store/zustand/use-ui-store";
import { t } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import type { Category } from "@/features/categories/category.types";
import type { Collection } from "@/features/collections/collection.types";
import type { ReservationStatus } from "@/features/reservations/reservation.types";
import type { Locale } from "@/types/common";

interface NavbarProps {
  categories?: Category[];
  collections?: Collection[];
  locale?: Locale;
  isSignedIn?: boolean;
  cartItemCount?: number;
  reservationStatus?: ReservationStatus | null;
}

/** Which nav items open a hover mega menu, and what each shows — "Collections" means the curated editorial groupings, "Categories" means the taxonomic classification; the two are genuinely different data, not two labels for the same list. */
const MEGA_MENU_ROUTES: Record<string, "collections" | "categories"> = {
  [ROUTES.collections]: "collections",
  [ROUTES.categories]: "categories",
};

/** Sticky top navigation — desktop mega menus for Collections/Categories, mobile hamburger opens MobileNav (Phase 2 "Navbar", "Mega Menu"). */
export function Navbar({
  categories = [],
  collections = [],
  locale = "en",
  isSignedIn = false,
  cartItemCount = 0,
  reservationStatus = null,
}: NavbarProps) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const activeMegaMenu = useAppSelector((s) => s.ui.activeMegaMenu);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const triggerRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Kept sticky to the last non-null kind so the panel's content doesn't
  // blank out mid-close-animation — `open` (below) is what actually drives
  // visibility, this only decides what to show while visible/closing.
  const [lastMegaMenuKind, setLastMegaMenuKind] = useState<
    "collections" | "categories"
  >("collections");

  const isMegaMenuOpen = activeMegaMenu !== null;

  useEffect(() => {
    if (activeMegaMenu === "collections" || activeMegaMenu === "categories") {
      setLastMegaMenuKind(activeMegaMenu);
    }
  }, [activeMegaMenu]);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const openMegaMenu = useCallback(
    (kind: "collections" | "categories") => {
      clearCloseTimeout();
      dispatch(setActiveMegaMenu(kind));
    },
    [clearCloseTimeout, dispatch],
  );

  // Hover-intent close: a short delay so moving the cursor from the trigger
  // toward the panel (even diagonally, through the gap between them) doesn't
  // close the menu before it arrives — cancelled by openMegaMenu if the
  // trigger or panel is re-entered within the window.
  const scheduleCloseMegaMenu = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      dispatch(setActiveMegaMenu(null));
    }, 180);
  }, [clearCloseTimeout, dispatch]);

  const closeMegaMenuNow = useCallback(() => {
    clearCloseTimeout();
    dispatch(setActiveMegaMenu(null));
  }, [clearCloseTimeout, dispatch]);

  useEffect(() => clearCloseTimeout, [clearCloseTimeout]);

  const megaMenuContent =
    lastMegaMenuKind === "collections"
      ? {
          items: collections.map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            imageUrl: c.imageUrl,
          })),
          hrefBuilder: ROUTES.collection,
          ariaLabel: "Collections",
          emptyMessage:
            "Collections will appear here once added in the admin panel.",
        }
      : {
          items: categories.map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            imageUrl: c.imageUrl,
          })),
          hrefBuilder: ROUTES.category,
          ariaLabel: "Categories",
          emptyMessage:
            "Categories will appear here once added in the admin panel.",
        };

  // Home only matches exactly (otherwise it'd "activate" for every route);
  // everything else matches its own path and any nested path beneath it.
  const isRouteActive = useMemo(
    () => (href: string) =>
      href === ROUTES.home
        ? pathname === ROUTES.home
        : pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <Container
        as="nav"
        width="wide"
        className="flex h-18 items-center justify-between gap-6"
      >
        <Link
          href={ROUTES.home}
          className="min-w-0 truncate font-heading text-base tracking-wide sm:text-lg"
        >
          {SITE.name}
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {PRIMARY_NAV.map((item) => {
            const megaMenuKind = MEGA_MENU_ROUTES[item.href];
            const active = isRouteActive(item.href);
            return (
              <li
                key={item.href}
                className="relative"
                onMouseEnter={
                  megaMenuKind ? () => openMegaMenu(megaMenuKind) : undefined
                }
                onMouseLeave={megaMenuKind ? scheduleCloseMegaMenu : undefined}
              >
                <Link
                  ref={(el) => {
                    triggerRefs.current[item.href] = el;
                  }}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-sm text-sm font-medium transition-colors hover:text-gold-dark focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                    active && "text-gold-dark",
                  )}
                  onFocus={
                    megaMenuKind ? () => openMegaMenu(megaMenuKind) : undefined
                  }
                  aria-haspopup={megaMenuKind ? "true" : undefined}
                  aria-expanded={
                    megaMenuKind
                      ? isMegaMenuOpen && lastMegaMenuKind === megaMenuKind
                      : undefined
                  }
                  onKeyDown={
                    megaMenuKind
                      ? (event) => {
                          if (event.key === "Escape") {
                            closeMegaMenuNow();
                            triggerRefs.current[item.href]?.focus();
                          }
                        }
                      : undefined
                  }
                >
                  {item.label[locale]}
                </Link>
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-gold"
                  />
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <HeaderSearch locale={locale} />
          <Button
            variant="outline-gold"
            size="sm"
            className="hidden sm:inline-flex"
            nativeButton={false}
            render={
              <a href={`tel:${SITE.phone}`}>
                <Phone className="size-3.5" />
                {SITE.phoneDisplay}
              </a>
            }
          />
          <Magnetic className="hidden md:inline-block">
            <Button
              variant="gold"
              size="sm"
              nativeButton={false}
              render={
                <Link href={ROUTES.reservation}>{t("bookAVisit", locale)}</Link>
              }
            />
          </Magnetic>
          <HeaderAccountControl
            isSignedIn={isSignedIn}
            cartItemCount={cartItemCount}
            reservationStatus={reservationStatus}
          />
          <LocaleToggle locale={locale} />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </Container>

      {/* Mobile-only search row, directly under the header (Tanishq-style) —
          replaces the icon-triggered dropdown, which stays desktop-only. */}
      <div className="border-t border-border px-4 py-2.5 sm:hidden">
        <HeaderSearch variant="bar" locale={locale} />
      </div>

      <MegaMenu
        open={isMegaMenuOpen}
        items={megaMenuContent.items}
        hrefBuilder={megaMenuContent.hrefBuilder}
        ariaLabel={megaMenuContent.ariaLabel}
        emptyMessage={megaMenuContent.emptyMessage}
        locale={locale}
        onClose={closeMegaMenuNow}
        onMouseEnter={() => openMegaMenu(lastMegaMenuKind)}
        onMouseLeave={scheduleCloseMegaMenu}
      />
    </header>
  );
}
