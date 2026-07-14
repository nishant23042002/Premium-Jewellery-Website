import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Award, Gem, ShieldCheck, Sparkles } from "lucide-react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/motion/hero-carousel";
import { ImageReveal } from "@/components/motion/image-reveal";
import { Reveal } from "@/components/motion/reveal";
import { CollectionCard } from "@/components/storefront/collection-card";
import { CollectionBentoGrid } from "@/components/storefront/collection-bento-grid";
import { CategoryShowcaseGrid } from "@/components/storefront/category-showcase-grid";
import { ProductCard } from "@/components/storefront/product-card";
import { StylingStoryCarousel } from "@/components/storefront/styling-story-carousel";
import { ExperienceTile } from "@/components/storefront/experience-tile";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { TestimonialsCarousel } from "@/components/marketing/testimonials-carousel";
import { listCategories } from "@/features/categories/category.actions";
import { listCollections } from "@/features/collections/collection.actions";
import { listProducts } from "@/features/products/product.actions";
import { listHeroSlides } from "@/features/hero-slides/hero-slide.actions";
import { listStylingStoriesResolved } from "@/features/styling-stories/styling-story.actions";
import { listTestimonials } from "@/features/testimonials/testimonial.actions";
import { getHomepageConfig } from "@/features/homepage/homepage-config.actions";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/features/homepage/homepage-config.types";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { ROUTES, SITE } from "@/constants";

export const metadata: Metadata = {
  ...canonicalFor(ROUTES.home),
};

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    label: "BIS Hallmarked",
    detail: "Every gold piece certified",
  },
  {
    icon: Sparkles,
    label: "Transparent Pricing",
    detail: "Live rate, no hidden charges",
  },
  {
    icon: Award,
    label: "Est. Local Trust",
    detail: "Generations of Roha families",
  },
  {
    icon: Gem,
    label: "Handpicked Craft",
    detail: "Bridal to everyday fine jewellery",
  },
];

/**
 * "Shree Ambika Experience" tiles — mirrors Tanishq's boxed image-grid
 * layout (screenshot reference), but every destination is a real page/action
 * already on this site, not a fabricated feature. Reuses existing photos
 * (no new photography available, same constraint as HERO_SLIDES).
 */
const DEFAULT_EXPERIENCE_TILES = [
  {
    title: "Visit Our Store",
    href: ROUTES.contact,
    imageUrl:
      "https://res.cloudinary.com/thelayerco/image/upload/v1783788864/Ambika-Jewellers/Luxury_jewelry_showroom_interior_2K_202607112217_ghgyc4.jpg",
    alt: `${SITE.name} showroom interior`,
  },
  {
    title: "Book an Appointment",
    href: ROUTES.reservation,
    imageUrl:
      "https://res.cloudinary.com/thelayerco/image/upload/v1783788864/Ambika-Jewellers/Luxury_Indian_jewelry_showroom_i__202607112218_eo09br.jpg",
    alt: `${SITE.name} showroom display`,
  },
  {
    title: "Talk to an Expert",
    href: `https://wa.me/${SITE.whatsappNumber}`,
    external: true,
    imageUrl:
      "https://res.cloudinary.com/thelayerco/image/upload/v1783788862/Ambika-Jewellers/Luxury_Indian_bridal_jewellery_d__202607112218_-_Copy_pqnwqm.jpg",
    alt: "Bridal jewellery display",
  },
  {
    title: "Read Our Journal",
    href: ROUTES.blog,
    imageUrl:
      "https://res.cloudinary.com/thelayerco/image/upload/v1783788862/Ambika-Jewellers/Indian_jewellery_display_showroom_2K_202607112218_uenwaa.jpg",
    alt: `${SITE.name} jewellery display`,
  },
  {
    title: "Jewellery Care Guide",
    href: ROUTES.jewelleryCare,
    imageUrl:
      "https://res.cloudinary.com/thelayerco/image/upload/v1783788861/Ambika-Jewellers/Indian_gold_diamond_earrings_stand_202607112218_-_Copy_vc0bye.jpg",
    alt: "Gold diamond earrings",
  },
  {
    title: "Hallmark & Certification",
    href: ROUTES.hallmark,
    imageUrl:
      "https://res.cloudinary.com/thelayerco/image/upload/v1783788858/Ambika-Jewellers/Gold_engagement_ring_on_pedestal_202607112218_-_Copy_uz9ctl.jpg",
    alt: "Gold engagement ring on pedestal",
  },
];

export default async function HomePage() {
  const [
    categories,
    collections,
    onlineExclusive,
    allProducts,
    newArrivals,
    testimonials,
    homepageConfig,
    stylingStories,
    heroSlides,
    locale,
  ] = await Promise.all([
    safeQuery(() => listCategories(), []),
    safeQuery(() => listCollections(), []),
    safeQuery(
      () => listProducts({ availability: "made_to_order", pageSize: 4 }),
      {
        items: [],
        total: 0,
        page: 1,
        pageSize: 4,
        totalPages: 1,
      },
    ),
    safeQuery(() => listProducts({ pageSize: 8 }), {
      items: [],
      total: 0,
      page: 1,
      pageSize: 8,
      totalPages: 1,
    }),
    safeQuery(() => listProducts({ sort: "newest", pageSize: 4 }), {
      items: [],
      total: 0,
      page: 1,
      pageSize: 4,
      totalPages: 1,
    }),
    safeQuery(() => listTestimonials(), []),
    safeQuery(() => getHomepageConfig(), DEFAULT_HOMEPAGE_CONFIG),
    safeQuery(() => listStylingStoriesResolved(), []),
    safeQuery(() => listHeroSlides({ publishedOnly: true }), []),
    getStorefrontLocale(),
  ]);

  const spotlightCollections = collections.filter((c) => c.isFeatured);
  const homeCollections =
    spotlightCollections.length > 0 ? spotlightCollections : collections;

  // Positional overrides — index matches DEFAULT_EXPERIENCE_TILES order.
  const experienceImageOverrides = [
    homepageConfig.experienceVisitStoreImageUrl,
    homepageConfig.experienceBookAppointmentImageUrl,
    homepageConfig.experienceTalkToExpertImageUrl,
    homepageConfig.experienceReadJournalImageUrl,
    homepageConfig.experienceJewelleryCareImageUrl,
    homepageConfig.experienceHallmarkImageUrl,
  ];
  const experienceTiles = DEFAULT_EXPERIENCE_TILES.map((tile, i) => ({
    ...tile,
    imageUrl: experienceImageOverrides[i] || tile.imageUrl,
  }));

  return (
    <>
      {/* ---------- Hero ---------- */}
      {/* Every slide is a complete, pre-designed banner (copy/branding
          baked into the image itself, Tanishq-style) — no text/CTA overlay
          here. An sr-only heading keeps a real <h1> on the page for SEO and
          screen readers without showing visible hero copy. */}
      {heroSlides.length > 0 && (
        <section className="relative overflow-hidden">
          <h1 className="sr-only">{SITE.name}</h1>
          <HeroCarousel slides={heroSlides} />
        </section>
      )}

      {/* ---------- Featured collections ---------- */}
      {homepageConfig.showCollections && homeCollections.length > 0 && (
        <section className="section">
          <Container>
            <SectionHeading
              eyebrow="Browse"
              title="Shop by Collection"
              description="Curated groupings to help you find the right piece faster — from bridal sets to everyday gold."
            />
            <div>
              {homeCollections.length >= 3 ? (
                // Tanishq-style "1 tall + 2 stacked" bento layout — needs
                // exactly 3 tiles to read intentionally.
                <CollectionBentoGrid
                  collections={[
                    homeCollections[0],
                    homeCollections[1],
                    homeCollections[2],
                  ]}
                />
              ) : (
                // Fewer than 3 collections — the bento layout has nothing
                // sensible to do with a lone or paired tile, so fall back to
                // the plain N-up grid instead of forcing an empty slot.
                <Grid
                  cols={{ base: Math.min(homeCollections.length, 2) }}
                  gap="lg"
                >
                  {homeCollections.map((collection) => (
                    <CollectionCard
                      key={collection.id}
                      item={collection}
                      href={ROUTES.collection(collection.slug)}
                      eyebrow="Collection"
                      className={
                        homeCollections.length === 1 ? "sm:max-w-xs" : undefined
                      }
                    />
                  ))}
                </Grid>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* ---------- Find Your Perfect Match (category grid) ---------- */}
      {homepageConfig.showCategories && categories.length > 0 && (
        <section className="section border-t border-border bg-secondary/20">
          <Container>
            <SectionHeading
              eyebrow="Browse by Type"
              title="Find Your Perfect Match"
              description="Every piece in our catalogue, organized the way our showroom is — by type, not by trend."
            />
            <div className="mt-10">
              <CategoryShowcaseGrid categories={categories} />
            </div>
          </Container>
        </section>
      )}

      {/* ---------- Online Exclusive (made-to-order products) ---------- */}
      {/* Was "Featured Pieces" sourced from isFeatured — that flag/badge
          logic stays intact (ProductCard still shows a "Featured" badge
          wherever isFeatured is true) but no longer drives this section. */}
      {homepageConfig.showOnlineExclusive &&
        (onlineExclusive.items.length > 0 ? (
          <section className="section border-t border-border">
            <Container>
              <SectionHeading
                eyebrow="Made For You"
                title="Online Exclusive"
                description="Handcrafted to order — reserve yours online and it's made especially for you."
              />
              <div className="mt-10">
                <Grid cols={{ base: 2, lg: 4 }} gap="lg">
                  {onlineExclusive.items.map(({ product, price }) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      price={price}
                      locale={locale}
                    />
                  ))}
                </Grid>
              </div>
            </Container>
          </section>
        ) : (
          <section className="section border-t border-border">
            <Container className="text-center">
              <SectionHeading
                align="center"
                eyebrow="Made For You"
                title="Online Exclusive, Coming Soon"
                description="Made-to-order pieces are being added — check back shortly, or visit the showroom to see what's in store today."
              />
            </Container>
          </section>
        ))}

      {/* ---------- All products (8, links out to the full catalogue) ---------- */}
      {homepageConfig.showAllProducts && allProducts.items.length > 0 && (
        <section className="section border-t border-border bg-secondary/20">
          <Container>
            <SectionHeading
              eyebrow="Shop"
              title="Our Complete Collection"
              description="Every piece we carry, from everyday gold to statement bridal sets."
            />
            <div className="mt-10">
              <Grid cols={{ base: 2, lg: 4 }} gap="lg">
                {allProducts.items.map(({ product, price }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    price={price}
                    locale={locale}
                  />
                ))}
              </Grid>
            </div>
            <Reveal className="mt-10 text-center">
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={ROUTES.products}>View All Products</Link>}
              />
            </Reveal>
          </Container>
        </section>
      )}

      {/* ---------- New Arrivals ---------- */}
      {homepageConfig.showNewArrivals && newArrivals.items.length > 0 && (
        <section className="section border-t border-border bg-secondary/20">
          <Container>
            <SectionHeading
              eyebrow="Just In"
              title="New Arrivals"
              description="The latest pieces added to our catalogue, freshest first."
            />
            <div className="mt-10">
              <Grid cols={{ base: 2, lg: 4 }} gap="lg">
                {newArrivals.items.map(({ product, price }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    price={price}
                    locale={locale}
                  />
                ))}
              </Grid>
            </div>
          </Container>
        </section>
      )}

      {/* ---------- Styling stories (video reel) ---------- */}
      {/* An overlapping video-card stack, Tanishq-reel style — each story's
          own title/subtitle is shown by the carousel itself and updates as
          the visitor navigates, so the section heading here stays generic. */}
      {homepageConfig.showStyling && stylingStories.length > 0 && (
        <section className="section border-t border-border">
          <Container>
            <SectionHeading
              eyebrow="Style Guide"
              title="Ways to Wear It"
              align="center"
            />
            <div className="mt-4 sm:mt-10">
              <StylingStoryCarousel stories={stylingStories} />
            </div>
          </Container>
        </section>
      )}

      {/* ---------- Story teaser ---------- */}
      {homepageConfig.showStoryTeaser && (
        <section className="section border-t border-border bg-secondary/20">
          <Container className="grid items-center gap-10 sm:my-15 lg:grid-cols-2">
            <ImageReveal className="relative aspect-4/3 rounded-2xl lg:order-2">
              <Image
                src={
                  homepageConfig.storyImageUrl ||
                  "https://res.cloudinary.com/thelayerco/image/upload/v1783788862/Ambika-Jewellers/Indian_jewellery_display_showroom_2K_202607112218_uenwaa.jpg"
                }
                alt={`${SITE.name} jewellery display`}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </ImageReveal>
            <Reveal direction="left" className="lg:order-1">
              <p className="text-gradient-gold mb-3 text-xs font-medium tracking-[0.2em] uppercase">
                Our Story
              </p>
              <h2 className="font-heading text-3xl">
                A trusted name in Roha, presented anew
              </h2>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                {SITE.name} has served families across {SITE.address.city} with
                honest pricing and genuine craftsmanship. This site is a new way
                to browse what we offer — the trust is the same trust you&apos;d
                find walking through our doors.
              </p>
              <Button
                variant="outline-gold"
                className="mt-6"
                nativeButton={false}
                render={<Link href={ROUTES.about}>Read Our Story</Link>}
              />
            </Reveal>
          </Container>
        </section>
      )}

      {/* ---------- Trust bar (moved lower, mirrors Tanishq's rhythm) ---------- */}
      {homepageConfig.showTrustBar && (
        <section className="py-10 sm:py-20">
          <Container>
            <Grid cols={{ base: 2, sm: 4 }} gap="lg">
              {TRUST_POINTS.map((point, i) => (
                <Reveal
                  key={point.label}
                  index={i}
                  className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left"
                >
                  <point.icon className="size-6 text-gold" strokeWidth={1.5} />
                  <p className="text-sm font-medium">{point.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {point.detail}
                  </p>
                </Reveal>
              ))}
            </Grid>
          </Container>
        </section>
      )}

      {/* ---------- Experience (Tanishq-style boxed image grid) ---------- */}
      {homepageConfig.showExperience && (
        <section className="section border-t bg-secondary/20">
          <Container>
            <Reveal className="overflow-hidden rounded-xl bg-background shadow-sm">
              <div className="px-6 py-10 text-center">
                <p className="text-gradient-gold mb-2 text-xs font-medium tracking-[0.2em] uppercase">
                  Shree Ambika Experience
                </p>
                <h2 className="font-heading text-2xl sm:text-3xl">
                  Find Us, Reach Us, Learn From Us
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {experienceTiles.map((tile) => (
                  <ExperienceTile key={tile.title} {...tile} />
                ))}
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      {/* ---------- Testimonials ---------- */}
      {homepageConfig.showTestimonials && testimonials.length > 0 && (
        <section className="section mb-5 border-t border-border">
          <Container>
            <SectionHeading
              align="center"
              eyebrow="What Families Say"
              title="Loved Across Generations"
            />
            <div className="mt-10">
              <Reveal className="sm:hidden">
                <TestimonialsCarousel testimonials={testimonials.slice(0, 4)} />
              </Reveal>
              <Grid
                cols={{ base: 1, sm: 2, lg: 4 }}
                gap="md"
                className="hidden sm:grid"
              >
                {testimonials.slice(0, 4).map((testimonial, i) => (
                  <Reveal key={testimonial.id} index={i}>
                    <TestimonialCard testimonial={testimonial} />
                  </Reveal>
                ))}
              </Grid>
            </div>
          </Container>
        </section>
      )}

      <CtaBanner />
    </>
  );
}
