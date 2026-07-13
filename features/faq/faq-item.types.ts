import type { LocalizedText } from "@/types/common";

export interface FaqItem {
  id: string;
  tenantId: string;
  question: LocalizedText;
  answer: LocalizedText;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
