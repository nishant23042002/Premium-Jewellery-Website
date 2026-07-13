import "server-only";
import { logger } from "@/lib/logger";

/**
 * Wraps a DB-dependent Server Action call so a connection failure degrades
 * to a fallback value instead of 500-ing the whole page. Used anywhere a
 * page fetches data that has a sensible empty state (categories, products,
 * rates) — genuinely useful in production (a brief DB hiccup shouldn't take
 * down navigation), and lets the storefront render before real data has
 * been seeded.
 */
export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error("safeQuery", "falling back after error", { error });
    return fallback;
  }
}
