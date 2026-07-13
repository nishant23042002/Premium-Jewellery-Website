/** Supported storefront locales (PRD §10 — trilingual from day one). */
export const LOCALES = ["en", "hi", "mr"] as const;
export type Locale = (typeof LOCALES)[number];

/** A field that must be entered in every supported locale. */
export type LocalizedText = Record<Locale, string>;

/** A field that may be filled in gradually, locale by locale (PRD §21). */
export type PartialLocalizedText = Partial<LocalizedText>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
