import type { Metadata } from "next";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/marketing/page-hero";
import { GalleryGrid } from "@/components/marketing/gallery-grid";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { listGalleryImages } from "@/features/gallery/gallery-image.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Store Gallery",
  description: "A look inside our Roha showroom.",
  keywords: ["jewellery showroom photos", "Roha jewellery store"],
  ...canonicalFor(ROUTES.gallery),
};

export default async function GalleryPage() {
  const images = await safeQuery(() => listGalleryImages(), []);

  return (
    <>
      <PageHero
        eyebrow="Visit"
        title="Inside the Showroom"
        description="A preview of the space — real photography is being added as we finish shooting the store."
        breadcrumbs={[{ label: "Store Gallery" }]}
      />

      <section className="section pt-0">
        <Container>
          {images.length > 0 ? (
            <GalleryGrid
              items={images.map((img) => ({
                id: img.id,
                caption: img.caption?.en,
                imageUrl: img.imageUrl,
              }))}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Showroom photos are being added — check back shortly.
              </p>
            </div>
          )}
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
