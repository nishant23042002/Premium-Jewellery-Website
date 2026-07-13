import type { LocalizedText } from "@/types/common";

/**
 * Curated, editorial grouping of products (e.g. "Bridal Edit", "Festive
 * Picks") — distinct from Category, which is the taxonomic classification
 * (Gold/Diamond/Silver). A product can appear in any number of collections.
 */
export interface Collection {
  id: string;
  tenantId: string;
  slug: string;
  name: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  productIds: string[];
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
