import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { ForgotPasswordForm } from "@/components/storefront/forgot-password-form";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: true },
};

const ACCOUNT_RECOVERY = { en: "Account Recovery", hi: "खाता पुनर्प्राप्ति", mr: "खाते पुनर्प्राप्ती" } as const;

export default async function ForgotPasswordPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect(ROUTES.account);

  const locale = await getStorefrontLocale();

  return (
    <>
      <PageHero
        eyebrow={ACCOUNT_RECOVERY[locale]}
        title={t("forgotPassword", locale)}
        breadcrumbs={[{ label: t("forgotPassword", locale) }]}
        locale={locale}
      />
      <section className="section pt-0">
        <Container className="max-w-md">
          <Card>
            <CardContent className="pt-2">
              <ForgotPasswordForm locale={locale} />
            </CardContent>
          </Card>
        </Container>
      </section>
    </>
  );
}
