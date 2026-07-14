import type { Metadata } from "next";
import { CalendarCheck, Clock, ShieldCheck, Users } from "lucide-react";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/marketing/page-hero";
import { ReservationForm } from "@/components/storefront/reservation-form";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { SITE } from "@/constants/site";

export const metadata: Metadata = {
  title: "Book a Visit",
  description:
    "Reserve a private viewing at our showroom — no obligation, just a closer look.",
};

const PERKS = [
  {
    icon: Users,
    title: "One-on-one attention",
    description:
      "A dedicated staff member walks you through pieces suited to what you're looking for.",
  },
  {
    icon: ShieldCheck,
    title: "No pressure",
    description:
      "Reserving a visit doesn't commit you to anything — come browse, ask questions, and decide later.",
  },
  {
    icon: Clock,
    title: "Save time",
    description:
      "Tell us what you're interested in ahead of time and we'll have relevant pieces ready to show.",
  },
];

interface ReservationPageProps {
  searchParams: Promise<{ product?: string }>;
}

export default async function ReservationPage({
  searchParams,
}: ReservationPageProps) {
  const { product } = await searchParams;
  const customer = await safeQuery(() => getCurrentCustomer(), null);

  return (
    <>
      <PageHero
        eyebrow="Plan Your Visit"
        title="Book a Private Viewing"
        description="Let us know when you'd like to visit and what you're interested in — we'll have it ready when you arrive."
        breadcrumbs={[{ label: "Reservation" }]}
      />

      <section className="section pt-0">
        <Container className="grid gap-10 lg:grid-cols-2">
          <Reveal direction="left" className="space-y-6">
            {PERKS.map((perk) => (
              <div key={perk.title} className="flex items-start gap-3">
                <perk.icon
                  className="mt-0.5 size-6 shrink-0 text-gold"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="text-sm font-medium">{perk.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {perk.description}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4">
              <CalendarCheck
                className="mt-0.5 size-6 shrink-0 text-gold"
                strokeWidth={1.5}
              />
              <p className="text-sm text-muted-foreground">
                We&apos;re open {SITE.hours.days}, {SITE.hours.opensAt} –{" "}
                {SITE.hours.closesAt}. We&apos;ll confirm your slot by phone
                shortly after you submit the form.
              </p>
            </div>
          </Reveal>

          <Reveal direction="right">
            <Card className="border-border/60">
              <CardContent className="pt-2">
                <h2 className="mb-4 font-heading text-xl">
                  Reserve Your Visit
                </h2>
                <ReservationForm
                  prefillProductSlug={product}
                  prefillCustomer={
                    customer
                      ? {
                          name: customer.name,
                          phone: customer.phone,
                          email: customer.email,
                        }
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
