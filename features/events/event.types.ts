import type { LocalizedText } from "@/types/common";

export interface StoreEvent {
  id: string;
  tenantId: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  date: string;
  location: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
