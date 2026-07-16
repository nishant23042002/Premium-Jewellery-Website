import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic-button";
import { ROUTES } from "@/constants/routes";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

/**
 * Deep-links into the Reservation flow with this product pre-selected
 * (Phase 5 "Reserve Button" → Phase 6 flow).
 *
 * Takes `locale` as a plain prop (defaulting to "en") rather than
 * self-fetching via `getStorefrontLocale()` — this is imported by
 * `product-quick-view.tsx`, a Client Component, and a server-only cookie
 * read anywhere in its module graph breaks the client bundle even if the
 * code path is never reached at runtime.
 */
export function ReserveButton({
  productSlug,
  className,
  locale = "en",
}: {
  productSlug: string;
  className?: string;
  locale?: Locale;
}) {
  return (
    <Magnetic className={className}>
      <Button
        size="lg"
        variant="gold"
        className="w-full"
        nativeButton={false}
        render={
          <Link href={`${ROUTES.reservation}?product=${productSlug}`}>
            <CalendarCheck className="size-4" />
            {t("reserveThisPiece", locale)}
          </Link>
        }
      />
    </Magnetic>
  );
}
