import Link from "next/link";
import { MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/common/social-icons";
import { Container } from "@/components/common/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BackToTopButton } from "@/components/layout/back-to-top-button";
import { FOOTER_NAV, ROUTES, SITE } from "@/constants";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";
import type { CmsPage } from "@/features/pages/page.types";

export function Footer({
  locale = "en",
  pages = [],
}: {
  locale?: Locale;
  pages?: CmsPage[];
}) {
  // A single source list for both the desktop columns and the mobile
  // accordion, so the two layouts can never drift out of sync.
  const groups = [
    ...FOOTER_NAV,
    ...(pages.length > 0
      ? [
          {
            heading: { en: "More", hi: "अधिक", mr: "अधिक" },
            items: pages.map((page) => ({
              label: page.title,
              href: ROUTES.page(page.slug),
            })),
          },
        ]
      : []),
  ];

  return (
    <footer className="rounded-t-4xl border-t border-border bg-secondary/40">
      <Container as="div" width="wide" className="py-12 sm:py-10">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="space-y-3 md:col-span-2">
            <p className="font-heading text-lg">{SITE.name}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {SITE.tagline}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-4 fill-gold text-gold" />
              <span className="font-medium text-foreground">
                {SITE.rating.value}
              </span>
              <span>
                ({SITE.rating.count.toLocaleString("en-IN")}{" "}
                {t("googleReviews", locale)})
              </span>
            </div>
            <div className="space-y-2 pt-2">
              <a
                href={`tel:${SITE.phone}`}
                className="flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
              >
                <Phone className="mt-0.5 size-4 shrink-0" />
                {SITE.phoneDisplay}
              </a>
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {SITE.address.full}
              </p>
            </div>
            <div className="flex items-center gap-6 pt-2">
              <a
                href={`https://wa.me/${SITE.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("chatOnWhatsApp", locale)}
                className="focus-luxury flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <MessageCircle className="size-4" />
              </a>
              <a
                href={`tel:${SITE.phone}`}
                aria-label={t("callUsAriaLabel", locale)}
                className="focus-luxury flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <Phone className="size-4" />
              </a>
              {SITE.social.instagramUrl && (
                <a
                  href={SITE.social.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("followUsOnInstagram", locale)}
                  className="focus-luxury flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <InstagramIcon className="size-4" />
                </a>
              )}
              {SITE.social.facebookUrl && (
                <a
                  href={SITE.social.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("followUsOnFacebook", locale)}
                  className="focus-luxury flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <FacebookIcon className="size-4" />
                </a>
              )}
            </div>
          </div>

          {/* Desktop — plain, always-expanded columns (unchanged layout). */}
          {groups.map((group) => (
            <div key={group.heading.en} className="hidden space-y-3 md:block">
              <p className="text-sm font-medium">{group.heading[locale]}</p>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-gold"
                    >
                      {item.label[locale]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile — collapsed accordion so the footer doesn't turn into an
            endless scroll of every link group stacked open. */}
        <Accordion defaultValue={[]} className="mt-8 md:hidden">
          {groups.map((group, index) => (
            <AccordionItem key={group.heading.en} value={String(index)}>
              <AccordionTrigger className="text-sm font-medium">
                {group.heading[locale]}
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-gold"
                      >
                        {item.label[locale]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>

      <Container
        as="div"
        width="wide"
        className="mb-16 flex flex-col items-center justify-between gap-3 border-t border-border py-4 text-center sm:flex-row sm:text-left"
      >
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {SITE.name}. {t("allRightsReserved", locale)}
        </p>
        <BackToTopButton locale={locale} />
      </Container>
    </footer>
  );
}
