"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderAuthDialog } from "@/components/storefront/header-auth-dialog";
import { useWishlistStore } from "@/store/zustand/use-wishlist-store";
import { usePolledValue } from "@/hooks/use-polled-value";
import { getActiveReservationStatusForCustomer } from "@/features/reservations/reservation.actions";
import { ROUTES } from "@/constants/routes";
import type { ReservationStatus } from "@/features/reservations/reservation.types";

interface HeaderAccountControlProps {
  isSignedIn: boolean;
  cartItemCount: number;
  /** null when there's nothing awaiting the customer's attention — see getActiveReservationStatusForCustomer. */
  reservationStatus?: ReservationStatus | null;
}

/** pending/confirmed are the only statuses this ever receives (see getActiveReservationStatusForCustomer) — completed/cancelled don't need a persistent dot. */
const RESERVATION_DOT_COLOR: Partial<Record<ReservationStatus, string>> = {
  pending: "bg-amber-500",
  confirmed: "bg-gold",
};

/** Header wishlist + user + cart icons. Signed-out user icon opens the Tanishq-style auth modal in place; signed-in it links straight to the account page. */
export function HeaderAccountControl({
  isSignedIn,
  cartItemCount,
  reservationStatus: initialReservationStatus = null,
}: HeaderAccountControlProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  // Polls just this one value instead of a full router.refresh() — the
  // header renders on every storefront page, so refreshing categories/
  // rates/offers/cart sitewide every 20s purely to catch a status dot
  // change would be wasteful.
  const reservationStatus = usePolledValue(
    getActiveReservationStatusForCustomer,
    initialReservationStatus,
    { enabled: isSignedIn },
  );
  const dotColor = reservationStatus
    ? RESERVATION_DOT_COLOR[reservationStatus]
    : undefined;

  return (
    <>
      {/* Wishlist and Account move into the mobile drawer (MobileNav) below
          the sm breakpoint — keeping only Cart in the header row is what
          stops the site name from getting squeezed on narrow screens. */}
      <Button
        variant="ghost"
        size="icon"
        className="relative hidden rounded-full border border-transparent hover:border-border sm:inline-flex"
        aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} item${wishlistCount === 1 ? "" : "s"}` : ""}`}
        nativeButton={false}
        render={
          <Link href={ROUTES.wishlist}>
            <Heart className="size-4" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-gold-foreground">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Link>
        }
      />

      {isSignedIn ? (
        <Button
          variant="ghost"
          size="icon"
          className="relative hidden rounded-full border border-transparent hover:border-border sm:inline-flex"
          aria-label={
            dotColor
              ? `My Account — reservation ${reservationStatus}`
              : "My Account"
          }
          nativeButton={false}
          render={
            <Link href={ROUTES.account}>
              <User className="size-4" />
              {dotColor && (
                <span
                  className={`absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background ${dotColor}`}
                />
              )}
            </Link>
          }
        />
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="hidden rounded-full border border-transparent hover:border-border sm:inline-flex"
          aria-label="Sign in"
          onClick={() => setAuthOpen(true)}
        >
          <User className="size-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full border border-transparent hover:border-border"
        aria-label={`Cart${cartItemCount > 0 ? `, ${cartItemCount} item${cartItemCount === 1 ? "" : "s"}` : ""}`}
        nativeButton={false}
        render={
          <Link href={ROUTES.cart}>
            <ShoppingBag className="size-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-gold-foreground">
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </span>
            )}
          </Link>
        }
      />

      <HeaderAuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
