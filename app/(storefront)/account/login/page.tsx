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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (customer) redirect(ROUTES.account);

  const { redirect: redirectTo } = await searchParams;

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
              <CustomerLoginForm redirectTo={redirectTo || ROUTES.account} />
            </CardContent>
          </Card>
        </Container>
      </section>
    </>
  );
}
