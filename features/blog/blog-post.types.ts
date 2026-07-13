import type { LocalizedText } from "@/types/common";

export interface BlogPost {
  id: string;
  tenantId: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  /** Paragraphs separated by a blank line — rendered as one `<p>` per paragraph. */
  content: LocalizedText;
  category: string;
  coverImageUrl?: string;
  author: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}
