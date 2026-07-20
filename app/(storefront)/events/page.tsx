import type { Metadata } from "next";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/marketing/page-hero";
import { EventCard } from "@/components/marketing/event-card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { listEvents } from "@/features/events/event.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Showroom events, seasonal previews, and exchange camps at Shree Ambika Jewellers.",
  keywords: ["jewellery showroom events", "gold exchange camp", "jewellery preview event"],
  ...canonicalFor(ROUTES.events),
};

export const revalidate = 3600;

export default async function EventsPage() {
  const events = await safeQuery(() => listEvents(), []);

  const upcoming = events.filter((e) => new Date(e.date) >= new Date());
  const past = events.filter((e) => new Date(e.date) < new Date());
  const sorted = [...upcoming, ...past];

  return (
    <>
      <PageHero
        eyebrow="Happenings"
        title="Showroom Events"
        description="Previews, trunk shows, and exchange camps — held at the Roha showroom throughout the year."
        breadcrumbs={[{ label: "Events" }]}
      />

      <section className="section pt-0">
        <Container>
          {sorted.length > 0 ? (
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="lg">
              {sorted.map((event, i) => (
                <Reveal key={event.slug} index={i}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </Grid>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No events scheduled right now — check back soon.
              </p>
            </div>
          )}
        </Container>
      </section>

      <CtaBanner
        title="Don't want to miss the next one?"
        description="Follow up with the showroom directly and we'll let you know when the next event is announced."
      />
    </>
  );
}
