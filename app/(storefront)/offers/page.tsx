import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { listOffers } from "@/features/offers/offer.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { formatDate } from "@/lib/utils/format";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Offers",
  description:
    "Current promotions on making charges, gold coins, and old gold exchange.",
  keywords: ["jewellery offers", "gold coin offers", "old gold exchange offer", "making charge discount"],
  ...canonicalFor(ROUTES.offers),
};

export default async function OffersPage() {
  const offers = await safeQuery(() => listOffers(), []);

  return (
    <>
      <PageHero
        eyebrow="Save"
        title="Current Offers"
        description="Promotions running at the showroom right now — always in addition to our everyday transparent pricing."
        breadcrumbs={[{ label: "Offers" }]}
      />

      <section className="section pt-0">
        <Container>
          {offers.length > 0 ? (
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="lg">
              {offers.map((offer, i) => (
                <Reveal key={offer.slug} index={i}>
                  <Card className="h-full border-border/60 shadow-sm">
                    <CardContent className="flex h-full flex-col gap-3 pt-2">
                      <Tag className="size-6 text-gold" strokeWidth={1.5} />
                      <h3 className="font-heading text-lg">{offer.title.en}</h3>
                      <p className="flex-1 text-sm text-muted-foreground">
                        {offer.description.en}
                      </p>
                      <Badge variant="outline" className="w-fit">
                        Valid until {formatDate(offer.validUntil)}
                      </Badge>
                      {offer.terms?.en && (
                        <p className="text-xs text-muted-foreground">
                          {offer.terms.en}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </Grid>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No live promotions right now — check back soon, or ask in
                showroom about current pricing.
              </p>
            </div>
          )}
        </Container>
      </section>

      <CtaBanner
        title="Redeem an offer in person"
        description="Offers are applied at the showroom counter — no codes needed, just mention it when you visit."
      />
    </>
  );
}
