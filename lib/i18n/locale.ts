import "server-only";
import { cookies } from "next/headers";
import { LOCALES, type Locale } from "@/types/common";

/** Separate cookie names for storefront vs admin — a shopper's language choice should never leak into (or be overwritten by) staff's admin-panel preference, and vice versa. */
export const STOREFRONT_LOCALE_COOKIE = "ambika_locale";
export const ADMIN_LOCALE_COOKIE = "ambika_admin_locale";

const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

function parseLocale(value: string | undefined): Locale {
  return (LOCALES as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : "en";
}

export async function getStorefrontLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get(STOREFRONT_LOCALE_COOKIE)?.value);
}

export async function getAdminLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get(ADMIN_LOCALE_COOKIE)?.value);
}

export const LOCALE_COOKIE_MAX_AGE = LOCALE_COOKIE_MAX_AGE_SECONDS;
