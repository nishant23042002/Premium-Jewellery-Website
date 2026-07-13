import type { Metadata } from "next";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/marketing/page-hero";
import { SITE } from "@/constants/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms governing the use of ${SITE.name}'s website.`,
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        breadcrumbs={[{ label: "Terms" }]}
      />

      <section className="section pt-0">
        <Container className="max-w-2xl space-y-8 text-sm text-muted-foreground">
          <p className="text-xs text-muted-foreground/70 italic">
            Placeholder terms — have this reviewed by counsel before launch.
          </p>

          <LegalSection title="About This Site">
            This website is a digital showroom for {SITE.name}. Prices shown are
            calculated live from the day&apos;s metal rate and are indicative of
            what you would be quoted in-store on the same day. This site does
            not process payments or complete transactions online — all purchases
            are finalized in person at our {SITE.address.city} showroom.
          </LegalSection>

          <LegalSection title="Pricing Accuracy">
            While we make every effort to keep displayed rates current, the
            final price for any purchase is confirmed at the time of sale
            in-store, based on that day&apos;s verified metal rate and the
            specific piece&apos;s weight after in-person verification.
          </LegalSection>

          <LegalSection title="Product Availability">
            Products shown online reflect our catalogue but are not guaranteed
            to be physically in-store at the moment of browsing. Use the
            Reservation page to confirm availability before visiting for a
            specific piece.
          </LegalSection>

          <LegalSection title="Enquiries and Reservations">
            Submitting an enquiry or reservation request does not constitute a
            binding purchase agreement. It is a request for us to prepare for
            your visit or respond with more information.
          </LegalSection>

          <LegalSection title="Intellectual Property">
            All content on this site, including text, images, and design, is the
            property of {SITE.name} unless otherwise noted, and may not be
            reproduced without permission.
          </LegalSection>

          <LegalSection title="Changes to These Terms">
            We may update these terms from time to time. Continued use of the
            site after changes constitutes acceptance of the updated terms.
          </LegalSection>

          <LegalSection title="Contact">
            Questions about these terms can be directed to {SITE.name} at{" "}
            {SITE.phoneDisplay}.
          </LegalSection>
        </Container>
      </section>
    </>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-2 font-heading text-lg text-foreground">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
