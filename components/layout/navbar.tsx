"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/container";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Magnetic } from "@/components/motion/magnetic-button";
import { MegaMenu } from "@/components/layout/mega-menu";
import { HeaderAccountControl } from "@/components/storefront/header-account-control";
import { HeaderSearch } from "@/components/storefront/header-search";
import { PRIMARY_NAV, ROUTES, SITE } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/store/redux/hooks";
import { setActiveMegaMenu } from "@/store/redux/slices/ui-slice";
import { useUiStore } from "@/store/zustand/use-ui-store";
import type { Category } from "@/features/categories/category.types";
import type { Locale } from "@/types/common";

interface NavbarProps {
  categories?: Category[];
  locale?: Locale;
  isSignedIn?: boolean;
  cartItemCount?: number;
}

/** Sticky top navigation — desktop mega menu for Collections, mobile hamburger opens MobileNav (Phase 2 "Navbar", "Mega Menu"). */
export function Navbar({
  categories = [],
  locale = "en",
  isSignedIn = false,
  cartItemCount = 0,
}: NavbarProps) {
  const dispatch = useAppDispatch();
  const activeMegaMenu = useAppSelector((s) => s.ui.activeMegaMenu);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const megaMenuTriggerRef = useRef<HTMLAnchorElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMegaMenuOpen = activeMegaMenu === "collections";

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const openMegaMenu = useCallback(() => {
    clearCloseTimeout();
    dispatch(setActiveMegaMenu("collections"));
  }, [clearCloseTimeout, dispatch]);

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
            const isCollections = item.href === ROUTES.collections;
            return (
              <li
                key={item.href}
                onMouseEnter={isCollections ? openMegaMenu : undefined}
                onMouseLeave={isCollections ? scheduleCloseMegaMenu : undefined}
              >
                <Link
                  ref={isCollections ? megaMenuTriggerRef : undefined}
                  href={item.href}
                  className="rounded-sm text-sm font-medium transition-colors hover:text-gold-dark focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  onFocus={isCollections ? openMegaMenu : undefined}
                  aria-haspopup={isCollections ? "true" : undefined}
                  aria-expanded={isCollections ? isMegaMenuOpen : undefined}
                  onKeyDown={
                    isCollections
                      ? (event) => {
                          if (event.key === "Escape") {
                            closeMegaMenuNow();
                            megaMenuTriggerRef.current?.focus();
                          }
                        }
                      : undefined
                  }
                >
                  {item.label[locale]}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <HeaderSearch />
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
              render={<Link href={ROUTES.reservation}>Book a Visit</Link>}
            />
          </Magnetic>
          <HeaderAccountControl
            isSignedIn={isSignedIn}
            cartItemCount={cartItemCount}
          />
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
        <HeaderSearch variant="bar" />
      </div>

      <MegaMenu
        open={isMegaMenuOpen}
        categories={categories}
        locale={locale}
        onClose={closeMegaMenuNow}
        onMouseEnter={openMegaMenu}
        onMouseLeave={scheduleCloseMegaMenu}
      />
    </header>
  );
}
