import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { CustomerLoginForm } from "@/components/storefront/customer-login-form";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";
import type { LocalizedText } from "@/types/common";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your account to track orders and manage your details.",
};

const WELCOME_BACK = { en: "Welcome Back", hi: "वापसी पर स्वागत है", mr: "पुन्हा स्वागत आहे" } as const;

const SOMETHING_WENT_WRONG = {
  en: "Something went wrong. Please try again.",
  hi: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
  mr: "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.",
} as const;

/** Shown as a toast when app/api/auth/google/callback/route.ts redirects back here with ?error=. */
const GOOGLE_ERROR_MESSAGES: Record<string, LocalizedText> = {
  google_denied: {
    en: "Google sign-in was cancelled.",
    hi: "Google साइन-इन रद्द कर दिया गया।",
    mr: "Google साइन-इन रद्द केले गेले.",
  },
  google_invalid_state: {
    en: "Your sign-in session expired. Please try again.",
    hi: "आपका साइन-इन सत्र समाप्त हो गया। कृपया पुनः प्रयास करें।",
    mr: "तुमचे साइन-इन सत्र संपले. कृपया पुन्हा प्रयत्न करा.",
  },
  google_not_configured: {
    en: "Google sign-in isn't available right now.",
    hi: "Google साइन-इन अभी उपलब्ध नहीं है।",
    mr: "Google साइन-इन सध्या उपलब्ध नाही.",
  },
  google_rate_limited: {
    en: "Too many attempts. Please try again in a few minutes.",
    hi: "बहुत अधिक प्रयास। कृपया कुछ मिनटों में पुनः प्रयास करें।",
    mr: "खूप जास्त प्रयत्न. कृपया काही मिनिटांत पुन्हा प्रयत्न करा.",
  },
  google_no_email: {
    en: "Your Google account doesn't have an email we can use.",
    hi: "आपके Google खाते में कोई उपयोग करने योग्य ईमेल नहीं है।",
    mr: "तुमच्या Google खात्यात वापरण्यायोग्य ईमेल नाही.",
  },
  google_email_unverified: {
    en: "Please verify your email with Google before signing in here.",
    hi: "यहां साइन इन करने से पहले कृपया Google से अपना ईमेल सत्यापित करें।",
    mr: "येथे साइन इन करण्यापूर्वी कृपया Google सह तुमचा ईमेल सत्यापित करा.",
  },
  google_account_deactivated: {
    en: "This account has been deactivated.",
    hi: "यह खाता निष्क्रिय कर दिया गया है।",
    mr: "हे खाते निष्क्रिय केले गेले आहे.",
  },
  google_signin_failed: {
    en: "Couldn't sign you in with Google. Please try again.",
    hi: "Google से साइन इन नहीं हो सका। कृपया पुनः प्रयास करें।",
    mr: "Google सह साइन इन करता आले नाही. कृपया पुन्हा प्रयत्न करा.",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (customer) redirect(ROUTES.account);

  const locale = await getStorefrontLocale();
  const { redirect: redirectTo, error } = await searchParams;
  const initialError = error
    ? (GOOGLE_ERROR_MESSAGES[error]?.[locale] ?? SOMETHING_WENT_WRONG[locale])
    : undefined;

  return (
    <>
      <PageHero
        eyebrow={WELCOME_BACK[locale]}
        title={t("signIn", locale)}
        breadcrumbs={[{ label: t("signIn", locale) }]}
        locale={locale}
      />
      <section className="section pt-0">
        <Container className="max-w-md">
          <Card>
            <CardContent className="pt-2">
              <CustomerLoginForm
                redirectTo={redirectTo || ROUTES.account}
                initialError={initialError}
                locale={locale}
              />
            </CardContent>
          </Card>
        </Container>
      </section>
    </>
  );
}
