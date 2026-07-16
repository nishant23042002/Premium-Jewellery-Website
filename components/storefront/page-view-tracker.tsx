"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logPageView } from "@/features/visitor-analytics/page-view.actions";

const VISITOR_COOKIE_NAME = "ambika_visitor_id";
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

/**
 * `crypto.randomUUID()` only exists in secure contexts (HTTPS, or
 * `localhost` specifically — browsers special-case that hostname). Testing
 * over a LAN IP like `http://192.168.x.x:3000` (e.g. previewing on a phone
 * during dev) is plain HTTP and not `localhost`, so the API is undefined
 * there and throws "crypto.randomUUID is not a function". This id is just
 * an anonymous analytics cookie, not a security token, so a non-crypto
 * fallback is fine — production is HTTPS, where the real API is always used.
 */
function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Anonymous first-party id — not a session/login token, just lets rollups tell new vs. returning traffic apart. Created once, read on every subsequent visit. */
function getOrCreateVisitorId(): string {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${VISITOR_COOKIE_NAME}=([^;]+)`),
  );
  if (match) return match[1];

  const id = randomId();
  document.cookie = `${VISITOR_COOKIE_NAME}=${id}; max-age=${VISITOR_COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
  return id;
}

/**
 * Mounted once in the storefront shell — logs a page view on first load and
 * on every client-side route change (App Router doesn't remount layouts on
 * `<Link>` navigation, so this listens to the pathname instead). Renders
 * nothing; failures are swallowed inside `logPageView` itself.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    logPageView({
      visitorId,
      path: pathname,
      referrer: document.referrer || undefined,
    });
  }, [pathname]);

  return null;
}
