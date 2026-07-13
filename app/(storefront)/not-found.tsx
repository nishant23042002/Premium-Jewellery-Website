import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic-button";
import { FloatingParticles } from "@/components/motion/floating-particles";
import { HeroHeading } from "@/components/motion/hero-reveal";
import { ROUTES } from "@/constants/routes";

const POPULAR_LINKS = [
  { label: "Collections", href: ROUTES.collections },
  { label: "Categories", href: ROUTES.categories },
  { label: "Offers", href: ROUTES.offers },
  { label: "Contact", href: ROUTES.contact },
];

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center gap-5 overflow-hidden px-6 text-center">
      <FloatingParticles className="opacity-60" />
      <p className="text-gradient-gold font-heading text-7xl">404</p>
      <HeroHeading text="This page wandered off" className="text-2xl" />
      <p className="max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
        Head back home, or jump to one of the pages below.
      </p>

      <Magnetic>
        <Button
          variant="gold"
          nativeButton={false}
          render={<Link href={ROUTES.home}>Back to Home</Link>}
        />
      </Magnetic>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {POPULAR_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
