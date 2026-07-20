import Link from "next/link";
import { ArrowRight, Gem } from "lucide-react";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { ROUTES } from "@/constants/routes";
import { t } from "@/lib/i18n/dictionary";
import type { Category } from "@/features/categories/category.types";
import type { Locale } from "@/types/common";

const DESKTOP_SLOTS = 8;
const MOBILE_SLOTS = 4;

function buildSlots(categories: Category[], maxSlots: number) {
  if (categories.length <= maxSlots) {
    return { visible: categories, showViewAll: false };
  }
  return { visible: categories.slice(0, maxSlots - 1), showViewAll: true };
}

function CategoryTile({
  category,
  locale,
}: {
  category: Category;
  locale: Locale;
}) {
  return (
    <Link
      href={ROUTES.category(category.slug)}
      className="group block text-center"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary min-[500px]:aspect-4/5">
        {category.imageUrl ? (
          <ImageWithFallback
            src={category.imageUrl}
            alt={category.name[locale]}
            fill
            sizes="(min-width: 640px) 22vw, 45vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="gradient-gold-animated flex size-full items-center justify-center">
            <Gem
              className="size-10 text-gold-foreground/40"
              strokeWidth={1}
              aria-hidden
            />
          </div>
        )}
      </div>
      <p className="mt-3 text-sm font-medium tracking-wide text-foreground uppercase">
        {category.name[locale]}
      </p>
    </Link>
  );
}

function ViewAllTile({
  totalCount,
  locale,
}: {
  totalCount: number;
  locale: Locale;
}) {
  return (
    <Link
      href={ROUTES.categories}
      className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border text-center transition-colors hover:border-gold/50 hover:bg-gold/5 min-[500px]:aspect-4/5"
    >
      <span className="font-heading text-3xl text-gold-dark">
        {totalCount}+
      </span>
      <span className="max-w-[70%] text-xs text-muted-foreground">
        {t("categoriesToChooseFrom", locale)}
      </span>
      <span className="mt-2 flex items-center gap-1 text-xs font-semibold tracking-wide text-gold-dark uppercase">
        {t("viewAll", locale)}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/**
 * Tanishq-style "Find Your Perfect Match" category showcase — a fixed
 * number of square image tiles with the category name below, and a final
 * "View All" tile once the real category count exceeds what fits. Rendered
 * as two parallel grids (mobile/desktop) toggled purely by CSS so the slot
 * count differs per breakpoint without a client-side media-query hook or
 * hydration mismatch.
 */
export function CategoryShowcaseGrid({
  categories,
  locale = "en",
}: {
  categories: Category[];
  locale?: Locale;
}) {
  const desktop = buildSlots(categories, DESKTOP_SLOTS);
  const mobile = buildSlots(categories, MOBILE_SLOTS);

  return (
    <>
      <div className="hidden grid-cols-4 gap-x-6 gap-y-8 sm:grid">
        {desktop.visible.map((category) => (
          <CategoryTile key={category.id} category={category} locale={locale} />
        ))}
        {desktop.showViewAll && (
          <ViewAllTile totalCount={categories.length} locale={locale} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-8 min-[500px]:grid-cols-2 sm:hidden">
        {mobile.visible.map((category) => (
          <CategoryTile key={category.id} category={category} locale={locale} />
        ))}
        {mobile.showViewAll && (
          <ViewAllTile totalCount={categories.length} locale={locale} />
        )}
      </div>
    </>
  );
}
