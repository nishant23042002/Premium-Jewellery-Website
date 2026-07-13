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
import type { Collection } from "@/features/collections/collection.types";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Curated collections — each edit built around an occasion, a finish, or a story.",
  ...canonicalFor(ROUTES.collections),
};

export default async function CollectionsPage() {
  const collections = await safeQuery(() => listCollections(), []);

  return (
    <>
      <PageHero
        eyebrow="Discover"
        title="Curated Collections"
        description="Beyond category, our collections group pieces by occasion and story — an easier way to shop with intent."
        breadcrumbs={[{ label: "Collections" }]}
      />

      <section className="section pt-0">
        <Container className="space-y-20">
          {collections.length > 0 ? (
            collections.map((collection, i) => (
              <CollectionRow
                key={collection.id}
                collection={collection}
                reverse={i % 2 === 1}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Our curated collections are being put together — check back
                shortly.
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
}: {
  collection: Collection;
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <ImageReveal
        className={`relative aspect-4/3 rounded-2xl ${reverse ? "lg:order-2" : ""}`}
      >
        {collection.imageUrl ? (
          <Image
            src={collection.imageUrl}
            alt={collection.name.en}
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
          The Edit
        </p>
        <h2 className="font-heading text-3xl">{collection.name.en}</h2>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          {collection.description?.en ||
            `A handpicked selection from our ${collection.name.en.toLowerCase()} edit.`}
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="gold"
            nativeButton={false}
            render={
              <Link href={ROUTES.collection(collection.slug)}>
                View Collection
              </Link>
            }
          />
        </div>
      </Reveal>
    </div>
  );
}
