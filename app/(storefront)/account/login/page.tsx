import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { CustomerLoginForm } from "@/components/storefront/customer-login-form";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your account to track orders and manage your details.",
};

/** Shown as a toast when app/api/auth/google/callback/route.ts redirects back here with ?error=. */
const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  google_invalid_state: "Your sign-in session expired. Please try again.",
  google_not_configured: "Google sign-in isn't available right now.",
  google_rate_limited: "Too many attempts. Please try again in a few minutes.",
  google_no_email: "Your Google account doesn't have an email we can use.",
  google_email_unverified:
    "Please verify your email with Google before signing in here.",
  google_account_deactivated: "This account has been deactivated.",
  google_signin_failed: "Couldn't sign you in with Google. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (customer) redirect(ROUTES.account);

  const { redirect: redirectTo, error } = await searchParams;
  const initialError = error
    ? (GOOGLE_ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.")
    : undefined;

  return (
    <>
      <PageHero
        eyebrow="Welcome Back"
        title="Sign In"
        breadcrumbs={[{ label: "Sign In" }]}
      />
      <section className="section pt-0">
        <Container className="max-w-md">
          <Card>
            <CardContent className="pt-2">
              <CustomerLoginForm
                redirectTo={redirectTo || ROUTES.account}
                initialError={initialError}
              />
            </CardContent>
          </Card>
        </Container>
      </section>
    </>
  );
}
