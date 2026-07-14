import type { LocalizedText } from "@/types/common";

export interface StylingStory {
  id: string;
  tenantId: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  coverImageUrl: string;
  /** Optional — takes priority over coverImageUrl on the storefront card when set. */
  videoUrl?: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StylingStoryResolved {
  id: string;
  title: string;
  subtitle?: string;
  coverImageUrl: string;
  videoUrl?: string;
}
