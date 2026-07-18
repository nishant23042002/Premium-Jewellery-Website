import type { Metadata } from "next";
import Script from "next/script";
import {
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Noto_Sans_Devanagari,
} from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { StoreJsonLd } from "@/components/common/store-json-ld";
import { buildMetadata } from "@/lib/seo/config";
import { getSeoConfig } from "@/features/settings/seo.actions";
import { getAppearanceConfig } from "@/features/settings/appearance.actions";
import { DEFAULT_SEO_CONFIG } from "@/features/settings/seo.types";
import { DEFAULT_APPEARANCE_CONFIG } from "@/features/settings/appearance.types";
import { safeQuery } from "@/lib/db/safe-query";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// Luxury display serif for headings — the Cartier/Tiffany register called
// for in the design language (PRD §14, §27). Latin only; Devanagari
// headings fall back to the Noto Sans Devanagari weight below.
const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Matching-weight Devanagari companion for Hindi/Marathi copy (PRD §27) —
// paired deliberately rather than left as a browser-default fallback.
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** SEO settings (Phase 7 "Settings > SEO") take priority over the static defaults when an admin has set them. */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await safeQuery(() => getSeoConfig(), DEFAULT_SEO_CONFIG);
  const appearance = await safeQuery(
    () => getAppearanceConfig(),
    DEFAULT_APPEARANCE_CONFIG,
  );
  const base = buildMetadata();

  return {
    ...base,
    ...(seo.defaultTitle && {
      title: {
        default: seo.defaultTitle,
        template: `%s | ${seo.defaultTitle}`,
      },
    }),
    ...(seo.defaultDescription && { description: seo.defaultDescription }),
    ...(seo.defaultKeywords && {
      keywords: seo.defaultKeywords.split(",").map((k) => k.trim()).filter(Boolean),
    }),
    openGraph: {
      ...base.openGraph,
      ...(seo.defaultDescription && { description: seo.defaultDescription }),
      ...(seo.ogImageUrl && { images: [seo.ogImageUrl] }),
    },
    ...(appearance.faviconUrl && { icons: { icon: appearance.faviconUrl } }),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appearance = await safeQuery(
    () => getAppearanceConfig(),
    DEFAULT_APPEARANCE_CONFIG,
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <Script
        id="abconsent-stub"
        data-cfasync="false"
        type="text/javascript"
        src="https://cache.consentframework.com/js/pa/53030/c/WgN91/stub?source=google-tag"
        strategy="beforeInteractive"
      />
      <Script
        id="abconsent-cmp"
        data-cfasync="false"
        type="text/javascript"
        src="https://choices.consentframework.com/js/pa/53030/c/WgN91/cmp?source=google-tag"
        strategy="beforeInteractive"
      />
      <Script
        id="google-tag-manager"
        src="https://www.googletagmanager.com/gtag/js?id=G-E3SGT4C3LE"
        strategy="beforeInteractive"
      />
      <Script id="google-tag" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-E3SGT4C3LE');
        `}
      </Script>
      {/* overflow-x-hidden: `Reveal`'s pre-animation transform offset
          (e.g. `direction="right"`'s translateX) can push content past the
          right edge on narrow viewports before it settles into place —
          clipping horizontally here stops that from creating page-level
          horizontal scroll, without affecting any intentional layout. */}
      <body className="flex min-h-full flex-col overflow-x-hidden">
        {appearance.accentColor && (
          <style
            // Admin-controlled and validated as a strict 6-digit hex (features/settings/appearance.schema.ts)
            // before it ever reaches here — safe to inline, no user-generated content involved.
            dangerouslySetInnerHTML={{
              __html: `:root, .dark { --gold: ${appearance.accentColor}; --gold-light: color-mix(in oklch, ${appearance.accentColor} 70%, white); --gold-dark: color-mix(in oklch, ${appearance.accentColor} 70%, black); }`,
            }}
          />
        )}
        <StoreJsonLd />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
