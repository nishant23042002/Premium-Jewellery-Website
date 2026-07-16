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
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";
import type { ReservationStatus } from "@/features/reservations/reservation.types";

const LOCAL_TEXT = {
  wishlist: { en: "Wishlist", hi: "विशलिस्ट", mr: "विशलिस्ट" },
  myAccountReservation: {
    en: (status: string) => `My Account — reservation ${status}`,
    hi: (status: string) => `मेरा खाता — आरक्षण ${status}`,
    mr: (status: string) => `माझे खाते — आरक्षण ${status}`,
  },
  myAccount: { en: "My Account", hi: "मेरा खाता", mr: "माझे खाते" },
  cart: { en: "Cart", hi: "कार्ट", mr: "कार्ट" },
  item: { en: "item", hi: "आइटम", mr: "आयटम" },
  items: { en: "items", hi: "आइटम", mr: "आयटम्स" },
} as const;

interface HeaderAccountControlProps {
  isSignedIn: boolean;
  cartItemCount: number;
  /** null when there's nothing awaiting the customer's attention — see getActiveReservationStatusForCustomer. */
  reservationStatus?: ReservationStatus | null;
  locale?: Locale;
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
  locale = "en",
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
        aria-label={`${LOCAL_TEXT.wishlist[locale]}${wishlistCount > 0 ? `, ${wishlistCount} ${wishlistCount === 1 ? LOCAL_TEXT.item[locale] : LOCAL_TEXT.items[locale]}` : ""}`}
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
            dotColor && reservationStatus
              ? LOCAL_TEXT.myAccountReservation[locale](reservationStatus)
              : LOCAL_TEXT.myAccount[locale]
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
          aria-label={t("signIn", locale)}
          onClick={() => setAuthOpen(true)}
        >
          <User className="size-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full border border-transparent hover:border-border"
        aria-label={`${LOCAL_TEXT.cart[locale]}${cartItemCount > 0 ? `, ${cartItemCount} ${cartItemCount === 1 ? LOCAL_TEXT.item[locale] : LOCAL_TEXT.items[locale]}` : ""}`}
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

      <HeaderAuthDialog open={authOpen} onOpenChange={setAuthOpen} locale={locale} />
    </>
  );
}
