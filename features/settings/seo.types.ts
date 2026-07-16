export interface SeoConfig {
  defaultTitle?: string;
  defaultDescription?: string;
  /** Comma-separated — stored as one string since that's what a single admin text input naturally holds; split into an array wherever it's consumed. */
  defaultKeywords?: string;
  ogImageUrl?: string;
}

export const DEFAULT_SEO_CONFIG: SeoConfig = {};
