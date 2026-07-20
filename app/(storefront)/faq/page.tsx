import type { Metadata } from "next";
import { FAQJsonLd } from "next-seo";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/marketing/page-hero";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { listFaqItems } from "@/features/faq/faq-item.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about pricing, hallmarking, reservations, and exchanges.",
  keywords: ["jewellery FAQ", "gold pricing questions", "hallmarking questions", "jewellery exchange policy"],
  ...canonicalFor(ROUTES.faq),
};

export const revalidate = 3600;

export default async function FaqPage() {
  const items = await safeQuery(() => listFaqItems(), []);

  return (
    <>
      {items.length > 0 && (
        <FAQJsonLd
          questions={items.map((item) => ({
            question: item.question.en,
            answer: item.answer.en,
          }))}
        />
      )}
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
