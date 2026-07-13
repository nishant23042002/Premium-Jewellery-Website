import type { LocalizedText } from "@/types/common";

/**
 * Ad-hoc static content pages (e.g. "Shipping Policy", "Careers") a
 * non-technical owner can add without a developer — distinct from the
 * bespoke-designed About/Privacy/Terms pages, which keep their custom
 * storefront layouts rather than being flattened into generic CMS content.
 */
export interface CmsPage {
  id: string;
  tenantId: string;
  slug: string;
  title: LocalizedText;
  content: LocalizedText;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
