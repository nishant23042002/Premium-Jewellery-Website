import type { Metadata } from "next";
import { BadgeCheck, Fingerprint, ScanSearch, ShieldCheck } from "lucide-react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "BIS Hallmark Certification",
  description:
    "What BIS hallmarking means, what the marks on your gold jewellery certify, and how every piece we sell is verified.",
  keywords: ["BIS hallmark", "hallmarked gold jewellery", "gold purity certification", "HUID number"],
  ...canonicalFor(ROUTES.hallmark),
};

export const revalidate = 3600;

const MARKS = [
  {
    icon: ShieldCheck,
    title: "BIS Logo",
    description:
      "The Bureau of Indian Standards mark confirming the piece was assayed by a BIS-recognized centre.",
  },
  {
    icon: BadgeCheck,
    title: "Purity Grade",
    description:
      "A code like 22K916 stating both the karatage (22K) and fineness (916 parts gold per 1000).",
  },
  {
    icon: Fingerprint,
    title: "HUID Number",
    description:
      "A unique 6-character alphanumeric ID assigned to that exact piece — no two pieces share one.",
  },
];

export default function HallmarkPage() {
  return (
    <>
      <PageHero
        eyebrow="Certification"
        title="What Our Hallmark Actually Certifies"
        description="Every gold piece we sell is BIS hallmarked. Here's what that means, and how to check it yourself."
        breadcrumbs={[{ label: "Hallmark" }]}
      />

      <section className="section">
        <Container>
          <SectionHeading
            eyebrow="The Basics"
            title="Three Marks, One Guarantee"
          />
          <div className="mt-10">
            <Grid cols={{ base: 1, sm: 3 }} gap="lg">
              {MARKS.map((mark, i) => (
                <Reveal key={mark.title} index={i}>
                  <mark.icon className="size-7 text-gold" strokeWidth={1.5} />
                  <h3 className="mt-3 font-heading text-lg">{mark.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {mark.description}
                  </p>
                </Reveal>
              ))}
            </Grid>
          </div>
        </Container>
      </section>

      <section className="section bg-secondary/20">
        <Container className="max-w-2xl">
          <Reveal className="flex items-start gap-4">
            <ScanSearch
              className="mt-1 size-8 shrink-0 text-gold"
              strokeWidth={1.5}
            />
            <div>
              <h2 className="font-heading text-2xl">
                How to Verify It Yourself
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Every hallmarked piece carries a HUID that can be checked
                against the BIS CARE app or website. When you visit our
                showroom, ask our staff to show you the HUID on any piece —
                we&apos;re happy to walk you through it before you buy, not just
                after.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Have questions about a specific piece from our{" "}
                <a
                  href={ROUTES.collections}
                  className="text-gold-dark underline underline-offset-4"
                >
                  collections
                </a>
                ? Reach out via our{" "}
                <a
                  href={ROUTES.contact}
                  className="text-gold-dark underline underline-offset-4"
                >
                  contact page
                </a>{" "}
                and we&apos;ll answer directly.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <CtaBanner
        title="See the hallmark for yourself"
        description="Visit the showroom and our team will walk you through the certification on any piece you're considering."
      />
    </>
  );
}
