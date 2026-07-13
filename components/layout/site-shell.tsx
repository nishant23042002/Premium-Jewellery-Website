import { listCategories } from "@/features/categories/category.actions";
import { listPublishedCmsPages } from "@/features/pages/page.actions";
import { getCurrentRates } from "@/features/metal-rates/metal-rate.actions";
import { listOffers } from "@/features/offers/offer.actions";
import { getAnnouncementBar } from "@/features/announcement-bar/announcement-bar.actions";
import { DEFAULT_ANNOUNCEMENT_BAR } from "@/features/announcement-bar/announcement-bar.types";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { getCartItemCount } from "@/features/cart/cart.actions";
import { getWishlistProductIds } from "@/features/wishlist/wishlist.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { GoldRateTicker } from "@/components/layout/gold-rate-ticker";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CompareBar } from "@/components/storefront/compare-bar";
import { WishlistHydrator } from "@/components/storefront/wishlist-hydrator";

/**
 * Server-rendered site chrome — fetches categories (for the mega menu) and
 * today's rates (for the ticker) once per full page load. App Router only
 * re-invokes `layout.tsx`/its children on a hard navigation, not on
 * client-side route changes within the same layout, so this doesn't hit
 * the DB on every link click. Falls back to empty/pending state if the DB
 * is unreachable — the nav should never be the reason the whole site 500s.
 */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [
    categories,
    pages,
    rates,
    announcementBar,
    offers,
    customer,
    cartItemCount,
    wishlistProductIds,
  ] = await Promise.all([
    safeQuery(() => listCategories(), []),
    safeQuery(() => listPublishedCmsPages(), []),
    safeQuery(() => getCurrentRates(), { gold: null, silver: null }),
    safeQuery(() => getAnnouncementBar(), DEFAULT_ANNOUNCEMENT_BAR),
    safeQuery(() => listOffers(), []),
    safeQuery(() => getCurrentCustomer(), null),
    safeQuery(() => getCartItemCount(), 0),
    safeQuery(() => getWishlistProductIds(), []),
  ]);

  // The announcement bar is how the site surfaces offers — auto-hide it
  // once there's nothing current to promote (published + not yet expired)
  // rather than relying on an admin to remember to toggle it off by hand.
  const hasCurrentOffers = offers.some(
    (offer) => new Date(offer.validUntil) >= new Date(),
  );

  return (
    <>
      <WishlistHydrator productIds={wishlistProductIds} />
      <AnnouncementBar
        config={announcementBar}
        hasCurrentOffers={hasCurrentOffers}
      />
      <GoldRateTicker rates={rates} />
      <Navbar
        categories={categories}
        isSignedIn={customer !== null}
        cartItemCount={cartItemCount}
      />
      <MobileNav isSignedIn={customer !== null} />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer pages={pages} />
      <BottomNav />
      <CompareBar />
    </>
  );
}
