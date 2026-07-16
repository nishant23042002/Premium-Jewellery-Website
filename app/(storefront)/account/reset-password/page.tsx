import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { ResetPasswordForm } from "@/components/storefront/reset-password-form";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: true },
};

const ACCOUNT_RECOVERY = { en: "Account Recovery", hi: "खाता पुनर्प्राप्ति", mr: "खाते पुनर्प्राप्ती" } as const;

const RESET_LINK_MISSING_TOKEN = {
  en: "This reset link is missing its token.",
  hi: "इस रीसेट लिंक में टोकन नहीं है।",
  mr: "या रीसेट लिंकमध्ये टोकन नाही.",
} as const;

const REQUEST_NEW_RESET_LINK = {
  en: "Request a new reset link",
  hi: "नया रीसेट लिंक अनुरोध करें",
  mr: "नवीन रीसेट लिंकची विनंती करा",
} as const;

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const customer = await getCurrentCustomer();
  if (customer) redirect(ROUTES.account);

  const locale = await getStorefrontLocale();
  const { token } = await searchParams;

  return (
    <>
      <PageHero
        eyebrow={ACCOUNT_RECOVERY[locale]}
        title={t("resetPassword", locale)}
        breadcrumbs={[{ label: t("resetPassword", locale) }]}
        locale={locale}
      />
      <section className="section pt-0">
        <Container className="max-w-md">
          <Card>
            <CardContent className="pt-2">
              {token ? (
                <ResetPasswordForm token={token} locale={locale} />
              ) : (
                <div className="space-y-3 text-center text-sm text-muted-foreground">
                  <p>{RESET_LINK_MISSING_TOKEN[locale]}</p>
                  <Link
                    href={ROUTES.accountForgotPassword}
                    className="inline-block text-gold-dark hover:underline"
                  >
                    {REQUEST_NEW_RESET_LINK[locale]}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </Container>
      </section>
    </>
  );
}
