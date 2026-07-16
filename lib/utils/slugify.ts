/** Turns a display name into a URL-safe slug matching `slugSchema` (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) — lowercase, alphanumeric, hyphen-separated. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
