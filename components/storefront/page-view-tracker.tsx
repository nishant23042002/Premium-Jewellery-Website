"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logPageView } from "@/features/visitor-analytics/page-view.actions";

const VISITOR_COOKIE_NAME = "ambika_visitor_id";
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

/** Anonymous first-party id — not a session/login token, just lets rollups tell new vs. returning traffic apart. Created once, read on every subsequent visit. */
function getOrCreateVisitorId(): string {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${VISITOR_COOKIE_NAME}=([^;]+)`),
  );
  if (match) return match[1];

  const id = crypto.randomUUID();
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
