/**
 * Canonical store/brand facts, sourced from the existing Google Business
 * listing (PRD context). Single source of truth — components should import
 * these rather than hardcoding copies.
 */
export const SITE = {
  name: "Shree Ambika Jewellers",
  nameLocal: "श्री अंबिका ज्वेलर्स",
  tagline:
    "The trust of your neighbourhood jeweller, presented like a global luxury brand.",
  legalCategory: "Jeweler",

  address: {
    line1: "402109, Main Bazar Peth",
    line2: "Roha Nagar, Wali, Roha Ashtami",
    city: "Roha",
    state: "Maharashtra",
    postalCode: "402109",
    country: "IN",
    full: "402109, Main Bazar Peth, Roha Nagar, Wali, Roha Ashtami, Maharashtra 402109",
  },

  phone: "+91 73854 44000",
  phoneDisplay: "073854 44000",
  whatsappNumber: "917385444000", // digits only, for wa.me links — confirm before launch
  adminEmail: "nishantsapkal2304@gmail.com",

  rating: {
    value: 4.9,
    count: 1402,
    source: "Google",
  },

  hours: {
    // Placeholder — confirm actual daily hours with the store before launch.
    opensAt: "10:00",
    closesAt: "20:00",
    days: "Mon–Sat",
  },

  social: {
    googleMapsUrl: "",
    instagramUrl: "",
    facebookUrl: "",
  },
} as const;
