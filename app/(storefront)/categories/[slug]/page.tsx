import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "next-seo";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { ProductCard } from "@/components/storefront/product-card";
import { PageHero } from "@/components/marketing/page-hero";
import { getCategoryBySlug } from "@/features/categories/category.actions";
import { listProducts } from "@/features/products/product.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { siteConfig } from "@/config/site.config";
import { SITE } from "@/constants/site";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { LocalizedText } from "@/types/common";

/** Singular "Category" label — the shared dictionary only has the plural "categories". */
const CATEGORY_SINGULAR: LocalizedText = { en: "Category", hi: "श्रेणी", mr: "श्रेणी" };

const EMPTY_STATE: LocalizedText = {
  en: "No pieces in this category are published online yet — visit the showroom to see what's in stock today.",
  hi: "इस श्रेणी में अभी तक कोई आभूषण ऑनलाइन प्रकाशित नहीं हुआ है — आज उपलब्ध स्टॉक देखने के लिए शोरूम पर आएं।",
  mr: "या श्रेणीतील कोणताही दागिना अद्याप ऑनलाइन प्रकाशित झालेला नाही — आज उपलब्ध साठा पाहण्यासाठी शोरूमला भेट द्या.",
};

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await safeQuery(() => getCategoryBySlug(slug), null);
  if (!category) return { title: "Category" };
  const description =
    category.description?.en ||
    `Shop the ${category.name.en} collection at ${SITE.name} — live, transparent pricing on every piece, handcrafted in ${SITE.address.city}.`;
  return {
    title: category.name.en,
    description,
    keywords: [
      category.name.en,
      `${category.name.en} jewellery`,
      `${category.name.en} jewellery ${SITE.address.city}`,
      "gold jewellery",
      "jewellery showroom",
      SITE.address.city,
    ],
    openGraph: { title: category.name.en, description },
    ...canonicalFor(ROUTES.category(category.slug)),
  };
}

export default async function CategoryDetailPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;
  const [category, locale] = await Promise.all([
    safeQuery(() => getCategoryBySlug(slug), null),
    getStorefrontLocale(),
  ]);

  if (!category) notFound();

  const products = await safeQuery(
    () => listProducts({ categoryId: category.id, pageSize: 24 }),
    { items: [], total: 0, page: 1, pageSize: 24, totalPages: 1 },
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", item: siteConfig.url },
          { name: "Categories", item: `${siteConfig.url}${ROUTES.categories}` },
          { name: category.name.en },
        ]}
      />
      <PageHero
        eyebrow={CATEGORY_SINGULAR[locale]}
        title={pickLocalized(category.name, locale)}
        description={pickLocalized(category.description, locale) || undefined}
        breadcrumbs={[
          { label: t("categories", locale), href: ROUTES.categories },
          { label: pickLocalized(category.name, locale) },
        ]}
        locale={locale}
        ]}
      />

      <section className="section pt-0">
        <Container>
          {products.items.length > 0 ? (
            <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap="lg">
              {products.items.map(({ product, price }) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  price={price}
                  locale={locale}
                />
              ))}
            </Grid>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">{EMPTY_STATE[locale]}</p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
