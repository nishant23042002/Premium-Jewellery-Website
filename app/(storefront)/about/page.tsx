import type { Metadata } from "next";
import Image from "next/image";
import { Award, Gem, HandHeart, ShieldCheck } from "lucide-react";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { ImageReveal } from "@/components/motion/image-reveal";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { SITE } from "@/constants";

export const metadata: Metadata = {
  title: "About Us",
  description: `The story behind ${SITE.name} — a trusted Roha jewellery showroom built on honest pricing and generations of craftsmanship.`,
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Transparent Pricing",
    description:
      "Every piece is priced live from the day's metal rate, with the full weight, making charge, and GST breakdown shown openly — online and in-store.",
  },
  {
    icon: Award,
    title: "Certified Purity",
    description:
      "All gold jewellery is BIS hallmarked. We stand behind what we sell with verifiable certification, not just our word.",
  },
  {
    icon: HandHeart,
    title: "Generational Trust",
    description:
      "Families across Roha have shopped with us for decades. Many of our customers today are the children of our earliest customers.",
  },
  {
    icon: Gem,
    title: "Considered Craft",
    description:
      "From bridal sets to everyday gold, every piece is chosen or made with the same attention — nothing in our case is an afterthought.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Story"
        title={`The Story Behind ${SITE.name}`}
        description="A showroom built the old way — on trust, transparency, and craftsmanship — now presented for a new generation of customers."
        breadcrumbs={[{ label: "About" }]}
      />

      <section className="section">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal direction="left" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {SITE.name} has been a fixture of {SITE.address.city}&apos;s Main
              Bazar Peth for generations — long enough that many of the families
              we serve today first walked through our doors as children with
              their own parents.
            </p>
            <p className="text-sm text-muted-foreground">
              What&apos;s kept them coming back isn&apos;t just the jewellery —
              it&apos;s knowing exactly what they&apos;re paying for. Every
              price we quote breaks down into metal value, making charge, and
              GST, calculated from the same day&apos;s rate whether you&apos;re
              browsing online or standing at the counter.
            </p>
            <p className="text-sm text-muted-foreground">
              This website doesn&apos;t change what we are — it&apos;s simply a
              new way to see the catalogue, check today&apos;s rate, and plan
              your visit before you arrive.
            </p>
          </Reveal>
          <ImageReveal className="relative aspect-4/3 rounded-2xl">
            <Image
              src="https://res.cloudinary.com/thelayerco/image/upload/v1783788864/Ambika-Jewellers/Luxury_Indian_jewelry_showroom_i__202607112218_eo09br.jpg"
              alt={`${SITE.name} showroom interior`}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          </ImageReveal>
        </Container>
      </section>

      <section className="section bg-secondary/20">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="What We Stand For"
            title="The Principles Behind Every Sale"
          />
          <div className="mt-12">
            <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
              {VALUES.map((value, i) => (
                <Reveal
                  key={value.title}
                  index={i}
                  className="flex flex-col items-start gap-3"
                >
                  <value.icon className="size-7 text-gold" strokeWidth={1.5} />
                  <h3 className="font-heading text-lg">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </Reveal>
              ))}
            </Grid>
          </div>
        </Container>
      </section>

      <CtaBanner
        title="Come see the difference in person"
        description="No amount of description replaces holding a piece in your hand. We'd love to show you around."
      />
    </>
  );
}
