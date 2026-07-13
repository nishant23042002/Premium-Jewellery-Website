import type { LocalizedText } from "@/types/common";

export interface Offer {
  id: string;
  tenantId: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  terms?: LocalizedText;
  validUntil: string;
  imageUrl?: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
