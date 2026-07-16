import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Gem } from "lucide-react";
import { Container } from "@/components/common/container";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { Button } from "@/components/ui/button";
import { ImageReveal } from "@/components/motion/image-reveal";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { listCollections } from "@/features/collections/collection.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Collection } from "@/features/collections/collection.types";
import type { Locale, LocalizedText } from "@/types/common";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Curated collections — each edit built around an occasion, a finish, or a story.",
  ...canonicalFor(ROUTES.collections),
};

/** Page-local copy not in the shared dictionary. */
const COLLECTIONS_PAGE_COPY: Record<string, LocalizedText> = {
  eyebrow: { en: "Discover", hi: "खोजें", mr: "शोधा" },
  title: { en: "Curated Collections", hi: "चुनिंदा कलेक्शन", mr: "निवडक कलेक्शन" },
  description: {
    en: "Beyond category, our collections group pieces by occasion and story — an easier way to shop with intent.",
    hi: "श्रेणी से परे, हमारे कलेक्शन आभूषणों को अवसर और कहानी के अनुसार समूहित करते हैं — इरादे के साथ खरीदारी करने का आसान तरीका।",
    mr: "श्रेणीच्या पलीकडे, आमचे कलेक्शन दागिन्यांना प्रसंग आणि कथेनुसार गटबद्ध करतात — हेतुपुरस्सर खरेदी करण्याचा सोपा मार्ग.",
  },
  emptyState: {
    en: "Our curated collections are being put together — check back shortly.",
    hi: "हमारे चुनिंदा कलेक्शन तैयार किए जा रहे हैं — जल्द ही दोबारा देखें।",
    mr: "आमचे निवडक कलेक्शन तयार केले जात आहेत — लवकरच पुन्हा तपासा.",
  },
  theEdit: { en: "The Edit", hi: "द एडिट", mr: "द एडिट" },
  viewCollection: { en: "View Collection", hi: "कलेक्शन देखें", mr: "कलेक्शन पहा" },
};

export default async function CollectionsPage() {
  const [collections, locale] = await Promise.all([
    safeQuery(() => listCollections(), []),
    getStorefrontLocale(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={COLLECTIONS_PAGE_COPY.eyebrow[locale]}
        title={COLLECTIONS_PAGE_COPY.title[locale]}
        description={COLLECTIONS_PAGE_COPY.description[locale]}
        breadcrumbs={[{ label: t("collections", locale) }]}
        locale={locale}
      />

      <section className="section pt-0">
        <Container className="space-y-20">
          {collections.length > 0 ? (
            collections.map((collection, i) => (
              <CollectionRow
                key={collection.id}
                collection={collection}
                reverse={i % 2 === 1}
                locale={locale}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {COLLECTIONS_PAGE_COPY.emptyState[locale]}
              </p>
            </div>
          )}
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}

function CollectionRow({
  collection,
  reverse,
  locale,
}: {
  collection: Collection;
  reverse?: boolean;
  locale: Locale;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <ImageReveal
        className={`relative aspect-4/3 rounded-2xl ${reverse ? "lg:order-2" : ""}`}
      >
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
            seed={collection.id}
            icon={Gem}
            className="h-full w-full"
          />
        )}
      </ImageReveal>
      <Reveal
        direction={reverse ? "right" : "left"}
        className={reverse ? "lg:order-1" : undefined}
      >
        <p className="text-gradient-gold mb-3 text-xs font-medium tracking-[0.2em] uppercase">
          {COLLECTIONS_PAGE_COPY.theEdit[locale]}
        </p>
        <h2 className="font-heading text-3xl">
          {pickLocalized(collection.name, locale)}
        </h2>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          {pickLocalized(collection.description, locale) ||
            `A handpicked selection from our ${collection.name.en.toLowerCase()} edit.`}
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="gold"
            nativeButton={false}
            render={
              <Link href={ROUTES.collection(collection.slug)}>
                {COLLECTIONS_PAGE_COPY.viewCollection[locale]}
              </Link>
            }
          />
        </div>
      </Reveal>
    </div>
  );
}
