import type { Metadata } from "next";
import { Star } from "lucide-react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/marketing/page-hero";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { GoogleReviewCard } from "@/components/marketing/google-review-card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { listTestimonials } from "@/features/testimonials/testimonial.actions";
import { getGoogleReviews } from "@/features/reviews/google-review.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { SITE } from "@/constants/site";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "What our customers say about their experience with Shree Ambika Jewellers.",
  keywords: ["jewellery store reviews", `${SITE.address.city} jewellers reviews`, "customer testimonials"],
  ...canonicalFor(ROUTES.testimonials),
};

export default async function TestimonialsPage() {
  // Real Google Reviews take priority when configured (live fetch, or the
  // last successfully cached batch if the Places API is down) — the
  // manually-curated Testimonial records are the fallback for when neither
  // exists yet, so the page is never empty.
  const [googleReviews, testimonials] = await Promise.all([
    safeQuery(() => getGoogleReviews(6), []),
    safeQuery(() => listTestimonials(), []),
  ]);
  const hasGoogleReviews = googleReviews.length > 0;

  return (
    <>
      <PageHero
        eyebrow="Reviews"
        title="What Families Say"
        breadcrumbs={[{ label: "Testimonials" }]}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="size-4 fill-gold text-gold" />
          <span className="font-medium text-foreground">
            {SITE.rating.value} average
          </span>
          <span>
            from {SITE.rating.count.toLocaleString("en-IN")}+ Google reviews
          </span>
        </div>
      </PageHero>

      <section className="section pt-0">
        <Container>
          {hasGoogleReviews ? (
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="lg">
              {googleReviews.map((review, i) => (
                <Reveal key={`${review.authorName}-${review.time}`} index={i}>
                  <GoogleReviewCard review={review} />
                </Reveal>
              ))}
            </Grid>
          ) : testimonials.length > 0 ? (
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="lg">
              {testimonials.map((testimonial, i) => (
                <Reveal key={testimonial.id} index={i}>
                  <TestimonialCard testimonial={testimonial} />
                </Reveal>
              ))}
            </Grid>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                We&apos;re gathering customer stories to feature here — check
                back soon.
              </p>
            </div>
          )}
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
