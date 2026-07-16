import type { Metadata } from "next";
import { Droplets, Package, Sparkle, Sun } from "lucide-react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Jewellery Care Guide",
  description:
    "How to clean, store, and care for your gold, diamond, and antique-finish jewellery between wears.",
  keywords: ["jewellery care guide", "how to clean gold jewellery", "jewellery storage tips"],
  ...canonicalFor(ROUTES.jewelleryCare),
};

const CARE_SECTIONS = [
  {
    icon: Droplets,
    title: "Cleaning",
    tips: [
      "Wipe plain gold with a soft, lint-free cloth after each wear to remove skin oils.",
      "Avoid ultrasonic cleaners on antique, temple, or stone-set pieces — the vibration can loosen settings.",
      "For diamond pieces, a mild soap-water soak followed by a soft brush works well; pat dry immediately.",
    ],
  },
  {
    icon: Package,
    title: "Storage",
    tips: [
      "Store each piece separately in a soft pouch or lined box — gold scratches gold.",
      "Keep chains fastened when stored to prevent tangling and stress on the clasp.",
      "Avoid humid spaces (like bathroom cabinets) — moisture accelerates tarnishing on silver and antique finishes.",
    ],
  },
  {
    icon: Sun,
    title: "Everyday Wear",
    tips: [
      "Put jewellery on last, after perfume, lotion, and hairspray, to avoid chemical contact.",
      "Remove rings and bracelets before swimming, cleaning, or heavy manual work.",
      "Antique and temple-finish pieces are more delicate than plain gold — treat them as occasion wear.",
    ],
  },
  {
    icon: Sparkle,
    title: "Professional Care",
    tips: [
      "Bring pieces in once or twice a year for a professional polish and a check on stone settings.",
      "If a stone feels loose, stop wearing the piece and bring it in — we'll re-secure it at no charge for pieces bought with us.",
      "Old gold exchange and cleaning services are available any time you visit the showroom.",
    ],
  },
];

export default function JewelleryCarePage() {
  return (
    <>
      <PageHero
        eyebrow="Guides"
        title="Caring for Your Jewellery"
        description="A few simple habits keep fine jewellery looking right for decades. Here's what we recommend."
        breadcrumbs={[{ label: "Jewellery Care" }]}
      />

      <section className="section">
        <Container>
          <SectionHeading
            eyebrow="The Essentials"
            title="Four Habits Worth Keeping"
          />
          <div className="mt-10">
            <Grid cols={{ base: 1, sm: 2 }} gap="lg">
              {CARE_SECTIONS.map((section, i) => (
                <Reveal
                  key={section.title}
                  index={i}
                  className="rounded-2xl border border-border p-6"
                >
                  <section.icon
                    className="size-7 text-gold"
                    strokeWidth={1.5}
                  />
                  <h3 className="mt-3 font-heading text-lg">{section.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {section.tips.map((tip) => (
                      <li
                        key={tip}
                        className="flex gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-gold" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </Grid>
          </div>
        </Container>
      </section>

      <CtaBanner
        title="Bring it in for a check-up"
        description="Free polish and stone-setting check for pieces purchased with us — just bring it by."
      />
    </>
  );
}
