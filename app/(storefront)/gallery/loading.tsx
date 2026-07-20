import { Container } from "@/components/common/container";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

/** Gallery is image-only — denser grid, no caption lines, matching GalleryGrid's photo-first layout. */
export default function GalleryLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="section pt-0">
        <Container>
          <CardGridSkeleton count={9} cols={{ base: 2, sm: 3, lg: 4 }} aspect="aspect-square" lines={0} />
        </Container>
      </section>
    </>
  );
}
