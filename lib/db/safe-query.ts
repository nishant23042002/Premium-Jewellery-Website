import "server-only";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/lib/logger";

/**
 * Messages `requireAdmin`/`requireRole`/`requirePermission` throw when a
 * session is missing or stale (lib/auth/session.ts, lib/auth/permissions.ts)
 * — expected during the brief window right after logout (the protected
 * layout's own redirect gate can race a page's data fetch on a soft
 * navigation that reuses a cached layout; see AdminLayout's comment on this
 * exact race). Not a bug, so it shouldn't log at "error" and trip Next's
 * blocking dev-overlay on every logout — "warn" still shows up in logs
 * without looking like a crash.
 */
const EXPECTED_AUTH_ERROR_MESSAGES = new Set([
  "Not authenticated",
  "Insufficient permissions",
  "This account has been deactivated",
]);

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
    // redirect()/notFound() work by throwing — without this, a wrapped call
    // that (now or in the future) redirects would have that redirect
    // silently swallowed into a fallback instead of navigating.
    unstable_rethrow(error);

    const isExpectedAuthRace =
      error instanceof Error && EXPECTED_AUTH_ERROR_MESSAGES.has(error.message);
    if (isExpectedAuthRace) {
      logger.warn("safeQuery", "falling back after expected auth error", { error });
    } else {
      logger.error("safeQuery", "falling back after error", { error });
    }
    return fallback;
  }
}
