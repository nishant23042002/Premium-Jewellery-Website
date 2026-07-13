import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { CustomerSignupForm } from "@/components/storefront/customer-signup-form";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an account to track your orders and save your details.",
};

export default async function SignupPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect(ROUTES.account);

  return (
    <>
      <PageHero
        eyebrow="Welcome"
        title="Create Your Account"
        description="Track orders, save addresses, and check out faster next time."
        breadcrumbs={[{ label: "Create Account" }]}
      />
      <section className="section pt-0">
        <Container className="max-w-md">
          <Card>
            <CardContent className="pt-2">
              <CustomerSignupForm />
            </CardContent>
          </Card>
        </Container>
      </section>
    </>
  );
}
