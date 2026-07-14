"use server";

import { cookies } from "next/headers";
import {
  STOREFRONT_LOCALE_COOKIE,
  ADMIN_LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
} from "@/lib/i18n/locale";
import type { Locale } from "@/types/common";

export async function setStorefrontLocale(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STOREFRONT_LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}

export async function setAdminLocale(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}
