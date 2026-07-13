import type { Metadata } from "next";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/marketing/page-hero";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { listFaqItems } from "@/features/faq/faq-item.actions";
import { safeQuery } from "@/lib/db/safe-query";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about pricing, hallmarking, reservations, and exchanges.",
};

export default async function FaqPage() {
  const items = await safeQuery(() => listFaqItems(), []);

  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Frequently Asked Questions"
        description="Can't find what you're looking for? Reach out via our contact page and we'll answer directly."
        breadcrumbs={[{ label: "FAQ" }]}
      />

      <section className="section">
        <Container>
          {items.length > 0 ? (
            <FaqAccordion
              items={items.map((item) => ({
                question: item.question.en,
                answer: item.answer.en,
              }))}
            />
          ) : (
            <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                We&apos;re putting together our FAQ — reach out via Contact in
                the meantime.
              </p>
            </div>
          )}
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
