import type { Metadata } from "next";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { CollectionCard } from "@/components/storefront/collection-card";
import { PageHero } from "@/components/marketing/page-hero";
import { listCategories } from "@/features/categories/category.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";
import type { Locale, LocalizedText } from "@/types/common";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Browse our full catalogue by category — gold, diamond, silver, and antique jewellery.",
  ...canonicalFor(ROUTES.categories),
};

/** Page-local copy not in the shared dictionary. */
const CATEGORIES_PAGE_COPY: Record<string, LocalizedText> = {
  eyebrow: { en: "Browse", hi: "ब्राउज़ करें", mr: "ब्राउझ करा" },
  title: { en: "Shop by Category", hi: "श्रेणी के अनुसार खरीदें", mr: "श्रेणीनुसार खरेदी करा" },
  description: {
    en: "Every piece in our catalogue, organized the way our showroom is — by type, not by trend.",
    hi: "हमारे कैटलॉग का हर आभूषण, हमारे शोरूम की तरह ही व्यवस्थित — प्रकार के अनुसार, ट्रेंड के अनुसार नहीं।",
    mr: "आमच्या कॅटलॉगमधील प्रत्येक दागिना, आमच्या शोरूमप्रमाणेच मांडलेला — प्रकारानुसार, ट्रेंडनुसार नाही.",
  },
  categoryEyebrow: { en: "Category", hi: "श्रेणी", mr: "श्रेणी" },
  emptyState: {
    en: "Categories are being added to the catalogue — check back shortly, or visit the showroom to browse in person.",
    hi: "कैटलॉग में श्रेणियाँ जोड़ी जा रही हैं — जल्द ही दोबारा देखें, या स्वयं ब्राउज़ करने के लिए शोरूम पर आएं।",
    mr: "कॅटलॉगमध्ये श्रेण्या जोडल्या जात आहेत — लवकरच पुन्हा तपासा, किंवा स्वतः ब्राउझ करण्यासाठी शोरूमला भेट द्या.",
  },
};

export default async function CategoriesPage() {
  const [categories, locale] = await Promise.all([
    safeQuery(() => listCategories(), []),
    getStorefrontLocale(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={CATEGORIES_PAGE_COPY.eyebrow[locale]}
        title={CATEGORIES_PAGE_COPY.title[locale]}
        description={CATEGORIES_PAGE_COPY.description[locale]}
        breadcrumbs={[{ label: t("categories", locale) }]}
        locale={locale}
      />

      <section className="section pt-0">
        <Container>
          {categories.length > 0 ? (
            <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap="lg">
              {categories.map((category) => (
                <CollectionCard
                  key={category.id}
                  item={category}
                  href={ROUTES.category(category.slug)}
                  eyebrow={CATEGORIES_PAGE_COPY.categoryEyebrow[locale]}
                  locale={locale}
                />
              ))}
            </Grid>
          ) : (
            <EmptyCategoriesState locale={locale} />
          )}
        </Container>
      </section>
    </>
  );
}

function EmptyCategoriesState({ locale }: { locale: Locale }) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-16 text-center">
      <p className="text-sm text-muted-foreground">
        {CATEGORIES_PAGE_COPY.emptyState[locale]}
      </p>
    </div>
  );
}
