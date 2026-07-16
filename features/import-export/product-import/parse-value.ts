/**
 * Splits a multi-value CSV cell into individual trimmed, non-empty values.
 * Tries a JSON array literal first (`["a","b"]`), then falls back to
 * splitting on whichever of pipe/semicolon/comma actually appears in the
 * cell — checked in that order since URLs themselves can legally contain a
 * comma-free query string but never a literal pipe or semicolon, so those
 * are unambiguous separators to try first when present.
 */
export function parseMultiValueCell(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((v) => String(v).trim())
          .filter((v) => v.length > 0);
      }
    } catch {
      // Not valid JSON — fall through to delimiter splitting.
    }
  }

  const delimiter = trimmed.includes("|")
    ? "|"
    : trimmed.includes(";")
      ? ";"
      : ",";

  return trimmed
    .split(delimiter)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/** Accepts "true"/"1"/"yes"/"y" (any case) as truthy — the existing CSV importer only recognized the literal string "true", silently treating "1"/"TRUE"/"yes" as false. */
export function parseBooleanCell(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y";
}
