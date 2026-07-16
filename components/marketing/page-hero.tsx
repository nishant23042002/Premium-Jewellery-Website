import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/common/container";
import {
  HeroHeading,
  HeroReveal,
  HeroRevealItem,
} from "@/components/motion/hero-reveal";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  className?: string;
  children?: React.ReactNode;
  locale?: Locale;
}

/**
 * Standard interior-page hero — eyebrow, masked headline reveal,
 * breadcrumb trail. Shared by every page under Phase 4 so the "premium
 * storytelling" opening beat is consistent site-wide rather than
 * reinvented per page.
 *
 * Takes `locale` as a plain prop (defaulting to "en") rather than
 * self-fetching via `getStorefrontLocale()` — this component is imported
 * by a couple of Client Components (e.g. wishlist/compare pages), and a
 * server-only cookie read anywhere in its module graph breaks the client
 * bundle even if the code path is never actually reached at runtime.
 * Callers that already have `locale` in scope should pass it through.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  className,
  children,
  locale = "en",
}: PageHeroProps) {
  return (
    <section className={cn("section border-b border-border", className)}>
      <Container>
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href={ROUTES.home} className="hover:text-foreground">
            {t("home", locale)}
          </Link>
          {breadcrumbs?.map((crumb) => (
            <span key={crumb.label} className="flex items-center gap-1">
              <ChevronRight className="size-3" />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <HeroReveal>
          {eyebrow && (
            <HeroRevealItem>
              <p className="text-gradient-gold mb-3 text-xs font-medium tracking-[0.2em] uppercase">
                {eyebrow}
              </p>
            </HeroRevealItem>
          )}
          <HeroHeading text={title} className="max-w-2xl text-display-md" />
          {description && (
            <HeroRevealItem>
              <p className="mt-5 max-w-xl text-base text-muted-foreground">
                {description}
              </p>
            </HeroRevealItem>
          )}
          {children && (
            <HeroRevealItem className="mt-6">{children}</HeroRevealItem>
          )}
        </HeroReveal>
      </Container>
    </section>
  );
}
