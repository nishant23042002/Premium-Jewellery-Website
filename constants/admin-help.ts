import { ROUTES } from "@/constants/routes";

/**
 * Field-level help entries for non-technical admins (a small "?" icon next
 * to a confusing field, per user request) — plain-language description of
 * what the field controls, a link to see it live, and (where the field maps
 * to one clear visual section) a screenshot of that section. Screenshots
 * are deliberately omitted for abstract fields (SEO meta tags, etc.) rather
 * than faked with an unrelated image.
 */
export interface AdminHelpEntry {
  description: string;
  siteHref: string;
  /** Cloudinary URL of a real screenshot of the relevant site section. Omit for fields with no single visual section (e.g. SEO meta). */
  screenshotUrl?: string;
}

export const ADMIN_HELP: Record<string, AdminHelpEntry> = {
  "homepage.showTrustBar": {
    description:
      "The row of four trust badges (BIS Hallmarked, Transparent Pricing, etc.) shown just below the hero.",
    siteHref: ROUTES.home,
  },
  "homepage.showCollections": {
    description:
      'The "Shop by Collection" section showing your featured collections as photo tiles.',
    siteHref: ROUTES.home,
  },
  "homepage.showOnlineExclusive": {
    description:
      'The "Online Exclusive" product grid — pieces set to "Made to Order" availability in the Products list appear here.',
    siteHref: ROUTES.home,
  },
  "homepage.showAllProducts": {
    description:
      'The "Shop Our Full Collection" section — shows 8 published products with a button linking to the full Products page.',
    siteHref: ROUTES.home,
  },
  "homepage.showCategories": {
    description:
      'The "Find Your Perfect Match" section showing your categories (Necklaces, Earrings, etc.) as photo tiles.',
    siteHref: ROUTES.home,
  },
  "homepage.showNewArrivals": {
    description:
      'The "New Arrivals" product grid — automatically shows your 4 most recently added products.',
    siteHref: ROUTES.home,
  },
  "homepage.showStyling": {
    description:
      'The "Ways to Wear It" editorial tiles reusing your collection photos with a caption, linking to that collection.',
    siteHref: ROUTES.home,
  },
  "homepage.showStoryTeaser": {
    description:
      'The "Our Story" section with a showroom photo and a short paragraph linking to the About page.',
    siteHref: ROUTES.home,
  },
  "homepage.showExperience": {
    description:
      'The "See It, Try It, Reserve It" 3-tile section (Visit Store / Book Appointment / WhatsApp) near the bottom of the home page.',
    siteHref: ROUTES.home,
  },
  "homepage.showTestimonials": {
    description:
      "The customer review cards shown near the bottom of the home page.",
    siteHref: ROUTES.home,
  },
  "announcementBar.enabled": {
    description:
      "The thin banner strip that runs across the very top of every page, above the main menu — used for time-sensitive notices (offers, holiday hours, etc.).",
    siteHref: ROUTES.home,
  },
  "announcementBar.message": {
    description:
      "The text shown inside the announcement banner at the top of every page.",
    siteHref: ROUTES.home,
  },
  "appearance.logoUrl": {
    description:
      "Your store logo shown in the navigation bar at the top of every storefront page.",
    siteHref: ROUTES.home,
  },
  "appearance.faviconUrl": {
    description:
      "The small icon shown in the browser tab and bookmarks — not visible on the page itself, only in the browser's tab bar.",
    siteHref: ROUTES.home,
  },
  "seo.defaultTitle": {
    description:
      "The page title shown in the browser tab and in Google search results — not a visible heading on the page itself.",
    siteHref: ROUTES.home,
  },
  "seo.defaultDescription": {
    description:
      "The short summary Google shows under your site's title in search results — not visible on the page itself.",
    siteHref: ROUTES.home,
  },
  "seo.defaultKeywords": {
    description:
      "Comma-separated terms that hint what your site is about to search engines — modern Google mostly ignores these for ranking, but they still help some search engines and directory listings. Not visible on the page itself.",
    siteHref: ROUTES.home,
  },
  "seo.ogImageUrl": {
    description:
      "The preview image shown when someone shares your site link on WhatsApp, Facebook, or other social apps — not visible on the page itself.",
    siteHref: ROUTES.home,
  },
};
