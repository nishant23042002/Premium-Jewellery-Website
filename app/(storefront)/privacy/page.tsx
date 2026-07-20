import type { Metadata } from "next";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/marketing/page-hero";
import { SITE } from "@/constants/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} collects, uses, and protects your information.`,
};

export const revalidate = 3600;

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        breadcrumbs={[{ label: "Privacy" }]}
      />

      <section className="section pt-0">
        <Container className="max-w-2xl space-y-8 text-sm text-muted-foreground">
          <p className="text-xs text-muted-foreground/70 italic">
            Placeholder policy — have this reviewed by counsel before launch to
            ensure it accurately reflects your data practices and complies with
            applicable law (including India&apos;s DPDP Act).
          </p>

          <LegalSection title="Information We Collect">
            When you submit an enquiry or reservation request through this site,
            we collect the name, phone number, and any message you provide. We
            do not require account creation or collect payment information
            online, since all purchases are completed in person at the showroom.
          </LegalSection>

          <LegalSection title="How We Use Your Information">
            Information submitted through our contact, reservation, and product
            enquiry forms is used solely to respond to your enquiry and, where
            relevant, prepare for your showroom visit. We do not sell or share
            your information with third parties for marketing purposes.
          </LegalSection>

          <LegalSection title="Cookies and Local Storage">
            We use browser local storage to remember items you&apos;ve
            shortlisted and your theme preference (light/dark mode). This data
            stays on your device and is not transmitted to our servers.
          </LegalSection>

          <LegalSection title="Data Retention">
            Enquiry and reservation records are retained for as long as needed
            to respond to your request and maintain our business records,
            consistent with applicable law.
          </LegalSection>

          <LegalSection title="Your Rights">
            You may request access to, correction of, or deletion of the
            personal information you&apos;ve submitted to us by contacting the
            showroom directly.
          </LegalSection>

          <LegalSection title="Contact">
            Questions about this policy can be directed to {SITE.name} at{" "}
            {SITE.phoneDisplay} or via our contact page.
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
