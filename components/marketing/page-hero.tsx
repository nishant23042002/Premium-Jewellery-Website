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
}

/**
 * Standard interior-page hero — eyebrow, masked headline reveal,
 * breadcrumb trail. Shared by every page under Phase 4 so the "premium
 * storytelling" opening beat is consistent site-wide rather than
 * reinvented per page.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  className,
  children,
}: PageHeroProps) {
  return (
    <section className={cn("section border-b border-border", className)}>
      <Container>
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href={ROUTES.home} className="hover:text-foreground">
            Home
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
