import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/marketing/page-hero";
import { EnquiryForm } from "@/components/storefront/enquiry-form";
import { SITE } from "@/constants/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with ${SITE.name} — phone, address, and showroom hours.`,
};

export default function ContactPage() {
  const mapQuery = encodeURIComponent(SITE.address.full);

  return (
    <>
      <PageHero
        eyebrow="Get in Touch"
        title="Contact Us"
        description="Questions about a piece, today's rate, or an order? Reach out and we'll respond directly."
        breadcrumbs={[{ label: "Contact" }]}
      />

      <section className="section pt-0">
        <Container className="grid gap-10 lg:grid-cols-2">
          <Reveal direction="left" className="space-y-6">
            <Card className="border-border/60">
              <CardContent className="space-y-4 pt-2">
                <ContactRow icon={Phone} label="Phone">
                  <a
                    href={`tel:${SITE.phone}`}
                    className="hover:text-gold-dark"
                  >
                    {SITE.phoneDisplay}
                  </a>
                </ContactRow>
                <ContactRow icon={Mail} label="WhatsApp">
                  <a
                    href={`https://wa.me/${SITE.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gold-dark"
                  >
                    Message us on WhatsApp
                  </a>
                </ContactRow>
                <ContactRow icon={MapPin} label="Address">
                  {SITE.address.full}
                </ContactRow>
                <ContactRow icon={Clock} label="Hours">
                  {SITE.hours.days}, {SITE.hours.opensAt} –{" "}
                  {SITE.hours.closesAt}
                </ContactRow>
              </CardContent>
            </Card>

            <div className="aspect-4/3 overflow-hidden rounded-2xl border border-border">
              <iframe
                title="Showroom location"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>

          <Reveal direction="right">
            <Card className="border-border/60">
              <CardContent className="pt-2">
                <h2 className="mb-4 font-heading text-xl">Send Us a Message</h2>
                <EnquiryForm />
              </CardContent>
            </Card>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.5} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{children}</p>
      </div>
    </div>
  );
}
