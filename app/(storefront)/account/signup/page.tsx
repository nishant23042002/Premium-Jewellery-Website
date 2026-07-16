import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { CustomerSignupForm } from "@/components/storefront/customer-signup-form";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an account to track your orders and save your details.",
};

const WELCOME = { en: "Welcome", hi: "स्वागत है", mr: "स्वागत आहे" } as const;

const SIGNUP_DESCRIPTION = {
  en: "Track orders, save addresses, and check out faster next time.",
  hi: "ऑर्डर ट्रैक करें, पते सहेजें, और अगली बार तेज़ी से चेकआउट करें।",
  mr: "ऑर्डर ट्रॅक करा, पत्ते जतन करा, आणि पुढच्या वेळी जलद चेकआउट करा.",
} as const;

export default async function SignupPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect(ROUTES.account);

  const locale = await getStorefrontLocale();

  return (
    <>
      <PageHero
        eyebrow={WELCOME[locale]}
        title={t("createAccount", locale)}
        description={SIGNUP_DESCRIPTION[locale]}
        breadcrumbs={[{ label: t("createAccount", locale) }]}
        locale={locale}
      />
      <section className="section pt-0">
        <Container className="max-w-md">
          <Card>
            <CardContent className="pt-2">
              <CustomerSignupForm locale={locale} />
            </CardContent>
          </Card>
        </Container>
      </section>
    </>
  );
}
