import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { ResetPasswordForm } from "@/components/storefront/reset-password-form";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Reset Password",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const customer = await getCurrentCustomer();
  if (customer) redirect(ROUTES.account);

  const { token } = await searchParams;

  return (
    <>
      <PageHero
        eyebrow="Account Recovery"
        title="Reset Password"
        breadcrumbs={[{ label: "Reset Password" }]}
      />
      <section className="section pt-0">
        <Container className="max-w-md">
          <Card>
            <CardContent className="pt-2">
              {token ? (
                <ResetPasswordForm token={token} />
              ) : (
                <div className="space-y-3 text-center text-sm text-muted-foreground">
                  <p>This reset link is missing its token.</p>
                  <Link
                    href={ROUTES.accountForgotPassword}
                    className="inline-block text-gold-dark hover:underline"
                  >
                    Request a new reset link
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
