import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";

/**
 * Shared metadata defaults for Next's native Metadata API (the App Router
 * way — PRD §16). Structured data (schema.org) is handled separately via
 * next-seo's App-Router-native JSON-LD components (see StoreJsonLd), since
 * next-seo's <DefaultSeo>/<NextSeo> components target the Pages Router.
 */
export const defaultDescription =
  "Shree Ambika Jewellers — a trusted jewellery showroom in Roha, Maharashtra. Browse our gold, diamond, and silver collections with live, transparent pricing.";

export function buildMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: defaultDescription,
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: siteConfig.url,
      siteName: siteConfig.name,
      description: defaultDescription,
    },
    twitter: {
      card: "summary_large_image",
    },
    ...overrides,
  };
}

/**
 * Canonical `alternates` for a leaf page's own `metadata`/`generateMetadata`
 * export — `path` is relative (e.g. `/product/gold-ring`) and resolves
 * against `metadataBase` set above. Spread into that page's returned object:
 * `{ ...canonicalFor(\`/product/${slug}\`) }`.
 */
export function canonicalFor(path: string): Pick<Metadata, "alternates"> {
  return { alternates: { canonical: path } };
}
