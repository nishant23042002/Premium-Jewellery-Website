import { clientEnv } from "@/config/env";
import { SITE } from "@/constants/site";

/** Composes brand facts + runtime env into the values SEO/sitemap config need. */
export const siteConfig = {
  ...SITE,
  url: clientEnv.NEXT_PUBLIC_SITE_URL,
  defaultLocale: "en" as const,
  locales: ["en", "hi", "mr"] as const,
};
