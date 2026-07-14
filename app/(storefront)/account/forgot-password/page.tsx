import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { ForgotPasswordForm } from "@/components/storefront/forgot-password-form";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default async function ForgotPasswordPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect(ROUTES.account);

  return (
    <>
      <PageHero
        eyebrow="Account Recovery"
        title="Forgot Password"
        breadcrumbs={[{ label: "Forgot Password" }]}
      />
      <section className="section pt-0">
        <Container className="max-w-md">
          <Card>
            <CardContent className="pt-2">
              <ForgotPasswordForm />
            </CardContent>
          </Card>
        </Container>
      </section>
    </>
  );
}
