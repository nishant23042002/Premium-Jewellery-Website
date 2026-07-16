import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Gem } from "lucide-react";
import { BreadcrumbJsonLd } from "next-seo";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { ImageReveal } from "@/components/motion/image-reveal";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/storefront/product-card";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { getCollectionBySlug } from "@/features/collections/collection.actions";
import { getProductsByIds } from "@/features/products/product.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { siteConfig } from "@/config/site.config";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { LocalizedText } from "@/types/common";

/** Singular "Collection" label — the shared dictionary only has the plural "collections". */
const COLLECTION_SINGULAR: LocalizedText = { en: "Collection", hi: "कलेक्शन", mr: "कलेक्शन" };

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await safeQuery(() => getCollectionBySlug(slug), null);
  if (!collection) return { title: "Collection" };
  return {
    title: `${collection.name.en} Collection`,
    description:
      collection.description?.en ||
      `An edit from our ${collection.name.en} range, handpicked to tell one story.`,
    ...canonicalFor(ROUTES.collection(collection.slug)),
  };
}

export default async function CollectionDetailPage({
  params,
}: CollectionPageProps) {
  const { slug } = await params;
  const [collection, locale] = await Promise.all([
    safeQuery(() => getCollectionBySlug(slug), null),
    getStorefrontLocale(),
  ]);

  if (!collection) notFound();

  const picks = await safeQuery(
    () => getProductsByIds(collection.productIds),
    [],
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", item: siteConfig.url },
          {
            name: "Collections",
            item: `${siteConfig.url}${ROUTES.collections}`,
          },
          { name: collection.name.en },
        ]}
      />
      <PageHero
        eyebrow={COLLECTION_SINGULAR[locale]}
        title={pickLocalized(collection.name, locale)}
        breadcrumbs={[
          { label: t("collections", locale), href: ROUTES.collections },
          { label: pickLocalized(collection.name, locale) },
        ]}
        locale={locale}
        ]}
      />

      <section className="section pt-0">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <ImageReveal className="relative aspect-4/3 rounded-2xl">
            {collection.imageUrl ? (
              <Image
                src={collection.imageUrl}
                alt={pickLocalized(collection.name, locale)}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            ) : (
              <PlaceholderImage
                seed={`collection-${collection.id}`}
                icon={Gem}
                className="h-full w-full"
              />
            )}
          </ImageReveal>
          <Reveal direction="left">
            <p className="text-sm text-muted-foreground">
              {pickLocalized(collection.description, locale) ||
                "A handpicked selection of pieces our staff reach for first when a customer asks “what would you recommend?”"}
            </p>
          </Reveal>
        </Container>
      </section>

      {picks.length > 0 && (
        <section className="section pt-0">
          <Container>
            <Grid cols={{ base: 2, lg: 4 }} gap="lg">
              {picks.map(({ product, price }) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  price={price}
                  locale={locale}
                />
              ))}
            </Grid>
          </Container>
        </section>
      )}

      <CtaBanner />
    </>
  );
}
