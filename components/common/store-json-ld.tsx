import { LocalBusinessJsonLd } from "next-seo";
import { siteConfig } from "@/config/site.config";

/**
 * schema.org structured data (PRD §16) via next-seo's App-Router-native
 * JSON-LD components (no next/head dependency, unlike its Pages-Router
 * <NextSeo>/<DefaultSeo> API). Rendered once from the root layout.
 */
export function StoreJsonLd() {
  return (
    <LocalBusinessJsonLd
      type="JewelryStore"
      name={siteConfig.name}
      url={siteConfig.url}
      telephone={siteConfig.phone}
      address={{
        streetAddress: siteConfig.address.line1,
        addressLocality: siteConfig.address.city,
        addressRegion: siteConfig.address.state,
        postalCode: siteConfig.address.postalCode,
        addressCountry: siteConfig.address.country,
      }}
      aggregateRating={{
        ratingValue: siteConfig.rating.value,
        reviewCount: siteConfig.rating.count,
      }}
      priceRange="₹₹₹"
    />
  );
}
