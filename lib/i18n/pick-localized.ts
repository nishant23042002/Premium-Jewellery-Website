import type { Locale, PartialLocalizedText } from "@/types/common";

/**
 * Resolves a {en, hi, mr} field for display. Admin content is entered
 * gradually per-locale (PRD §21) — most existing products/categories/etc.
 * only have `en` filled in, so a blank `hi`/`mr` value falls back to
 * English rather than rendering empty text.
 */
export function pickLocalized(
  field: PartialLocalizedText | undefined | null,
  locale: Locale,
): string {
  if (!field) return "";
  return field[locale] || field.en || Object.values(field).find(Boolean) || "";
}
