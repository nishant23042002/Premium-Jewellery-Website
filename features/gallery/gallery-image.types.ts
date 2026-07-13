import type { LocalizedText } from "@/types/common";

export interface GalleryImage {
  id: string;
  tenantId: string;
  imageUrl: string;
  caption?: LocalizedText;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
