import { ROUTES } from "@/constants/routes";
import type { LocalizedText } from "@/types/common";

export interface NavItem {
  label: LocalizedText;
  href: string;
}

/** Primary storefront navigation — feeds the Navbar/MegaMenu/MobileNav components. */
export const PRIMARY_NAV: NavItem[] = [
  {
    label: { en: "Collections", hi: "कलेक्शन", mr: "कलेक्शन" },
    href: ROUTES.collections,
  },
  {
    label: { en: "Categories", hi: "श्रेणियाँ", mr: "श्रेणी" },
    href: ROUTES.categories,
  },
  {
    label: { en: "Offers", hi: "ऑफर्स", mr: "ऑफर्स" },
    href: ROUTES.offers,
  },
  {
    label: { en: "Journal", hi: "जर्नल", mr: "जर्नल" },
    href: ROUTES.blog,
  },
  {
    label: { en: "About", hi: "हमारे बारे में", mr: "आमच्याबद्दल" },
    href: ROUTES.about,
  },
  {
    label: { en: "Contact", hi: "संपर्क करें", mr: "संपर्क करा" },
    href: ROUTES.contact,
  },
];

/** Compact 4-item set for the mobile bottom navigation bar. Search used to live here as a "scroll up and focus the header bar" button, but that read as broken/meaningless on tap — Wishlist is a real destination and the header search (desktop icon + always-visible mobile bar) is already reachable without it. */
export const BOTTOM_NAV: NavItem[] = [
  { label: { en: "Home", hi: "होम", mr: "होम" }, href: ROUTES.home },
  {
    label: { en: "Collections", hi: "कलेक्शन", mr: "कलेक्शन" },
    href: ROUTES.collections,
  },
  {
    label: { en: "Wishlist", hi: "विशलिस्ट", mr: "विशलिस्ट" },
    href: ROUTES.wishlist,
  },
  {
    label: { en: "Visit Us", hi: "शोरूम", mr: "शोरूम" },
    href: ROUTES.reservation,
  },
];

export interface FooterNavGroup {
  heading: LocalizedText;
  items: NavItem[];
}

/** Footer link groups — carries the long tail of pages that don't fit the top nav. */
export const FOOTER_NAV: FooterNavGroup[] = [
  {
    heading: { en: "Shop", hi: "खरीदें", mr: "खरेदी" },
    items: [
      {
        label: { en: "Collections", hi: "", mr: "" },
        href: ROUTES.collections,
      },
      { label: { en: "Categories", hi: "", mr: "" }, href: ROUTES.categories },
      { label: { en: "All Products", hi: "", mr: "" }, href: ROUTES.products },
      { label: { en: "Offers", hi: "", mr: "" }, href: ROUTES.offers },
    ],
  },
  {
    heading: { en: "Discover", hi: "जानें", mr: "जाणून घ्या" },
    items: [
      { label: { en: "About Us", hi: "", mr: "" }, href: ROUTES.about },
      {
        label: { en: "Hallmark Certification", hi: "", mr: "" },
        href: ROUTES.hallmark,
      },
      {
        label: { en: "Jewellery Care", hi: "", mr: "" },
        href: ROUTES.jewelleryCare,
      },
      { label: { en: "Store Gallery", hi: "", mr: "" }, href: ROUTES.gallery },
      {
        label: { en: "Testimonials", hi: "", mr: "" },
        href: ROUTES.testimonials,
      },
      { label: { en: "Events", hi: "", mr: "" }, href: ROUTES.events },
      { label: { en: "Journal", hi: "", mr: "" }, href: ROUTES.blog },
    ],
  },
  {
    heading: { en: "Support", hi: "सहायता", mr: "मदत" },
    items: [
      { label: { en: "FAQ", hi: "", mr: "" }, href: ROUTES.faq },
      { label: { en: "Contact Us", hi: "", mr: "" }, href: ROUTES.contact },
      {
        label: { en: "Book a Visit", hi: "", mr: "" },
        href: ROUTES.reservation,
      },
    ],
  },
  {
    heading: { en: "Legal", hi: "कानूनी", mr: "कायदेशीर" },
    items: [
      { label: { en: "Privacy Policy", hi: "", mr: "" }, href: ROUTES.privacy },
      { label: { en: "Terms of Service", hi: "", mr: "" }, href: ROUTES.terms },
    ],
  },
];
