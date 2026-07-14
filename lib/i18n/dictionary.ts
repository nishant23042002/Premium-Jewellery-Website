import type { Locale, LocalizedText } from "@/types/common";

/**
 * Static storefront chrome strings that aren't backed by admin-entered
 * content (nav/footer labels already live in constants/nav.ts as
 * LocalizedText) — buttons, CTAs, and labels repeated across many pages.
 * Deliberately scoped to the highest-visibility strings rather than every
 * string in the app; admin-entered content (product names, descriptions,
 * etc.) is resolved separately via `pickLocalized`.
 */
export const STOREFRONT_DICTIONARY = {
  bookAVisit: { en: "Book a Visit", hi: "विज़िट बुक करें", mr: "भेट बुक करा" },
  callUs: { en: "Call", hi: "कॉल करें", mr: "कॉल करा" },
  wishlist: { en: "Wishlist", hi: "विशलिस्ट", mr: "विशलिस्ट" },
  signIn: { en: "Sign In", hi: "साइन इन करें", mr: "साइन इन करा" },
  account: { en: "Account", hi: "खाता", mr: "खाते" },
  more: { en: "More", hi: "अधिक", mr: "अधिक" },
  addToCart: { en: "Add to Cart", hi: "कार्ट में डालें", mr: "कार्टमध्ये टाका" },
  reserveThisPiece: {
    en: "Reserve This Piece",
    hi: "यह पीस आरक्षित करें",
    mr: "हा दागिना राखीव ठेवा",
  },
  whatsappEnquiry: {
    en: "WhatsApp Enquiry",
    hi: "व्हाट्सएप पूछताछ",
    mr: "व्हॉट्सअॅप चौकशी",
  },
  enquire: { en: "Enquire", hi: "पूछताछ करें", mr: "चौकशी करा" },
  allRightsReserved: {
    en: "All rights reserved.",
    hi: "सर्वाधिकार सुरक्षित।",
    mr: "सर्व हक्क राखीव.",
  },
  chooseLanguage: { en: "Language", hi: "भाषा", mr: "भाषा" },
  searchPlaceholder: {
    en: "Search for jewellery...",
    hi: "ज्वेलरी खोजें...",
    mr: "दागिने शोधा...",
  },
  recentlyViewed: {
    en: "Recently Viewed",
    hi: "हाल ही में देखे गए",
    mr: "अलीकडे पाहिलेले",
  },
  youMayAlsoLike: {
    en: "You May Also Like",
    hi: "आपको यह भी पसंद आ सकता है",
    mr: "तुम्हाला हे देखील आवडेल",
  },
} as const satisfies Record<string, LocalizedText>;

export type StorefrontDictionaryKey = keyof typeof STOREFRONT_DICTIONARY;

export function t(key: StorefrontDictionaryKey, locale: Locale): string {
  return STOREFRONT_DICTIONARY[key][locale];
}

/** Admin-panel chrome — deliberately a much smaller set (nav + common actions) since staff work in English day-to-day; see the "admin light" scoping decision. */
export const ADMIN_DICTIONARY = {
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड", mr: "डॅशबोर्ड" },
  products: { en: "Products", hi: "उत्पाद", mr: "उत्पादने" },
  categories: { en: "Categories", hi: "श्रेणियाँ", mr: "श्रेणी" },
  collections: { en: "Collections", hi: "कलेक्शन", mr: "कलेक्शन" },
  offers: { en: "Offers", hi: "ऑफर्स", mr: "ऑफर्स" },
  orders: { en: "Orders", hi: "ऑर्डर", mr: "ऑर्डर" },
  reservations: { en: "Reservations", hi: "आरक्षण", mr: "आरक्षणे" },
  enquiries: { en: "Enquiries", hi: "पूछताछ", mr: "चौकशी" },
  analytics: { en: "Analytics", hi: "एनालिटिक्स", mr: "विश्लेषण" },
  media: { en: "Media", hi: "मीडिया", mr: "मीडिया" },
  settings: { en: "Settings", hi: "सेटिंग्स", mr: "सेटिंग्ज" },
  search: { en: "Search", hi: "खोजें", mr: "शोधा" },
  quickCreate: { en: "Quick Create", hi: "त्वरित बनाएं", mr: "जलद तयार करा" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल", mr: "प्रोफाइल" },
  logout: { en: "Log Out", hi: "लॉग आउट", mr: "लॉग आउट" },
  language: { en: "Language", hi: "भाषा", mr: "भाषा" },
} as const satisfies Record<string, LocalizedText>;

export type AdminDictionaryKey = keyof typeof ADMIN_DICTIONARY;

export function adminT(key: AdminDictionaryKey, locale: Locale): string {
  return ADMIN_DICTIONARY[key][locale];
}

/**
 * Sidebar nav group/item labels (`constants/admin-nav.ts`) are plain
 * strings, not LocalizedText — restructuring that whole nav tree (and every
 * consumer: sidebar, command palette, favorites/recents) was out of scope
 * for the "admin light" translation pass, so this is a lookup by the exact
 * English label instead. Falls back to the original string for anything
 * not listed here.
 */
const ADMIN_NAV_LABEL_TRANSLATIONS: Record<string, LocalizedText> = {
  Overview: { en: "Overview", hi: "अवलोकन", mr: "आढावा" },
  Catalogue: { en: "Catalogue", hi: "कैटलॉग", mr: "कॅटलॉग" },
  Sales: { en: "Sales", hi: "बिक्री", mr: "विक्री" },
  "Content (CMS)": { en: "Content (CMS)", hi: "कंटेंट (सीएमएस)", mr: "मजकूर (सीएमएस)" },
  Team: { en: "Team", hi: "टीम", mr: "टीम" },
  Site: { en: "Site", hi: "साइट", mr: "साइट" },
  Settings: { en: "Settings", hi: "सेटिंग्स", mr: "सेटिंग्ज" },
  System: { en: "System", hi: "सिस्टम", mr: "सिस्टम" },
  Dashboard: { en: "Dashboard", hi: "डैशबोर्ड", mr: "डॅशबोर्ड" },
  Analytics: { en: "Analytics", hi: "एनालिटिक्स", mr: "विश्लेषण" },
  Products: { en: "Products", hi: "उत्पाद", mr: "उत्पादने" },
  Collections: { en: "Collections", hi: "कलेक्शन", mr: "कलेक्शन" },
  Categories: { en: "Categories", hi: "श्रेणियाँ", mr: "श्रेणी" },
  Media: { en: "Media", hi: "मीडिया", mr: "मीडिया" },
  Offers: { en: "Offers", hi: "ऑफर्स", mr: "ऑफर्स" },
  Orders: { en: "Orders", hi: "ऑर्डर", mr: "ऑर्डर" },
  Reservations: { en: "Reservations", hi: "आरक्षण", mr: "आरक्षणे" },
  Customers: { en: "Customers", hi: "ग्राहक", mr: "ग्राहक" },
  Enquiries: { en: "Enquiries", hi: "पूछताछ", mr: "चौकशी" },
  "Metal Rates": { en: "Metal Rates", hi: "धातु दरें", mr: "धातू दर" },
  Blogs: { en: "Blogs", hi: "ब्लॉग", mr: "ब्लॉग" },
  Pages: { en: "Pages", hi: "पेज", mr: "पाने" },
  FAQ: { en: "FAQ", hi: "सामान्य प्रश्न", mr: "सामान्य प्रश्न" },
  Gallery: { en: "Gallery", hi: "गैलरी", mr: "गॅलरी" },
  "Styling Stories": {
    en: "Styling Stories",
    hi: "स्टाइलिंग स्टोरीज़",
    mr: "स्टाइलिंग स्टोरीज",
  },
  Testimonials: { en: "Testimonials", hi: "प्रशंसापत्र", mr: "अभिप्राय" },
  Events: { en: "Events", hi: "इवेंट्स", mr: "कार्यक्रम" },
  Staff: { en: "Staff", hi: "स्टाफ", mr: "कर्मचारी" },
  "Roles & Permissions": {
    en: "Roles & Permissions",
    hi: "भूमिकाएँ और अनुमतियाँ",
    mr: "भूमिका आणि परवानग्या",
  },
  "Homepage Builder": {
    en: "Homepage Builder",
    hi: "होमपेज बिल्डर",
    mr: "होमपेज बिल्डर",
  },
  "Hero Slides": { en: "Hero Slides", hi: "हीरो स्लाइड्स", mr: "हिरो स्लाइड्स" },
  "Announcement Bar": {
    en: "Announcement Bar",
    hi: "घोषणा बार",
    mr: "घोषणा बार",
  },
  Appearance: { en: "Appearance", hi: "अपीयरेंस", mr: "स्वरूप" },
  SEO: { en: "SEO", hi: "एसईओ", mr: "एसईओ" },
  "Audit Logs": { en: "Audit Logs", hi: "ऑडिट लॉग", mr: "ऑडिट लॉग" },
  "Recycle Bin": { en: "Recycle Bin", hi: "रीसायकल बिन", mr: "रीसायकल बिन" },
  Backups: { en: "Backups", hi: "बैकअप", mr: "बॅकअप" },
  "Import / Export": {
    en: "Import / Export",
    hi: "इम्पोर्ट / एक्सपोर्ट",
    mr: "इम्पोर्ट / एक्सपोर्ट",
  },
};

export function translateAdminNavLabel(label: string, locale: Locale): string {
  return ADMIN_NAV_LABEL_TRANSLATIONS[label]?.[locale] ?? label;
}
