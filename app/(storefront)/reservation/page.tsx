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
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";
import type { LocalizedText } from "@/types/common";

export const metadata: Metadata = {
  title: "Book a Visit",
  description:
    "Reserve a private viewing at our showroom — no obligation, just a closer look.",
};

const PLAN_YOUR_VISIT = { en: "Plan Your Visit", hi: "अपनी विज़िट की योजना बनाएं", mr: "तुमच्या भेटीचे नियोजन करा" } as const;

const RESERVATION_HERO_DESCRIPTION = {
  en: "Let us know when you'd like to visit and what you're interested in — we'll have it ready when you arrive.",
  hi: "हमें बताएं कि आप कब आना चाहेंगे और आप किसमें रुचि रखते हैं — जब आप पहुंचेंगे तो हम इसे तैयार रखेंगे।",
  mr: "तुम्हाला कधी भेट द्यायची आहे आणि तुम्हाला कशात रस आहे ते आम्हाला सांगा — तुम्ही पोहोचेपर्यंत आम्ही ते तयार ठेवू.",
} as const;

const RESERVATION_LABEL = { en: "Reservation", hi: "आरक्षण", mr: "आरक्षण" } as const;

const OPEN_HOURS_TEMPLATE = {
  en: (days: string, opensAt: string, closesAt: string) =>
    `We're open ${days}, ${opensAt} – ${closesAt}. We'll confirm your slot by phone shortly after you submit the form.`,
  hi: (days: string, opensAt: string, closesAt: string) =>
    `हम ${days}, ${opensAt} – ${closesAt} खुले रहते हैं। फ़ॉर्म जमा करने के तुरंत बाद हम फ़ोन पर आपका स्लॉट कन्फ़र्म करेंगे।`,
  mr: (days: string, opensAt: string, closesAt: string) =>
    `आम्ही ${days}, ${opensAt} – ${closesAt} उघडे असतो. फॉर्म सबमिट केल्यानंतर लवकरच आम्ही फोनवर तुमचा स्लॉट कन्फर्म करू.`,
} as const;

const PERKS: {
  icon: typeof Users;
  title: LocalizedText;
  description: LocalizedText;
}[] = [
  {
    icon: Users,
    title: {
      en: "One-on-one attention",
      hi: "व्यक्तिगत ध्यान",
      mr: "वैयक्तिक लक्ष",
    },
    description: {
      en: "A dedicated staff member walks you through pieces suited to what you're looking for.",
      hi: "एक समर्पित स्टाफ सदस्य आपको आपकी पसंद के अनुरूप आभूषण दिखाएगा।",
      mr: "एक समर्पित कर्मचारी तुम्हाला हवे असलेल्या दागिन्यांची माहिती देईल.",
    },
  },
  {
    icon: ShieldCheck,
    title: { en: "No pressure", hi: "कोई दबाव नहीं", mr: "कोणताही दबाव नाही" },
    description: {
      en: "Reserving a visit doesn't commit you to anything — come browse, ask questions, and decide later.",
      hi: "विज़िट आरक्षित करना आपको किसी भी चीज़ के लिए बाध्य नहीं करता — आएं, ब्राउज़ करें, सवाल पूछें, और बाद में निर्णय लें।",
      mr: "भेट राखीव केल्याने तुम्ही कशासाठीही बांधील होत नाही — या, ब्राउझ करा, प्रश्न विचारा आणि नंतर ठरवा.",
    },
  },
  {
    icon: Clock,
    title: { en: "Save time", hi: "समय बचाएं", mr: "वेळ वाचवा" },
    description: {
      en: "Tell us what you're interested in ahead of time and we'll have relevant pieces ready to show.",
      hi: "हमें पहले से बताएं कि आप किसमें रुचि रखते हैं और हम दिखाने के लिए संबंधित आभूषण तैयार रखेंगे।",
      mr: "तुम्हाला कशात रस आहे ते आधीच सांगा आणि आम्ही दाखवण्यासाठी संबंधित दागिने तयार ठेवू.",
    },
  },
];

interface ReservationPageProps {
  searchParams: Promise<{ product?: string }>;
}

export default async function ReservationPage({
  searchParams,
}: ReservationPageProps) {
  const { product } = await searchParams;
  const [customer, locale] = await Promise.all([
    safeQuery(() => getCurrentCustomer(), null),
    getStorefrontLocale(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={PLAN_YOUR_VISIT[locale]}
        title={t("bookAPrivateViewing", locale)}
        description={RESERVATION_HERO_DESCRIPTION[locale]}
        breadcrumbs={[{ label: RESERVATION_LABEL[locale] }]}
        locale={locale}
      />

      <section className="section pt-0">
        <Container className="grid gap-10 lg:grid-cols-2">
          <Reveal direction="left" className="space-y-6">
            {PERKS.map((perk) => (
              <div key={perk.title.en} className="flex items-start gap-3">
                <perk.icon
                  className="mt-0.5 size-6 shrink-0 text-gold"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="text-sm font-medium">{perk.title[locale]}</p>
                  <p className="text-sm text-muted-foreground">
                    {perk.description[locale]}
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
                {OPEN_HOURS_TEMPLATE[locale](
                  SITE.hours.days,
                  SITE.hours.opensAt,
                  SITE.hours.closesAt,
                )}
              </p>
            </div>
          </Reveal>

          <Reveal direction="right">
            <Card className="border-border/60">
              <CardContent className="pt-2">
                <h2 className="mb-4 font-heading text-xl">
                  {t("reserveYourVisit", locale)}
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
                  redirectTo={customer ? ROUTES.accountReservations : undefined}
                  locale={locale}
                />
              </CardContent>
            </Card>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
