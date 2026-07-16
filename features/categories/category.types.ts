import type { LocalizedText } from "@/types/common";

export interface Category {
  id: string;
  tenantId: string;
  slug: string;
  name: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  sortOrder: number;
  parentId?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
