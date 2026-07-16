import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/marketing/page-hero";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { getCartSummary } from "@/features/cart/cart.actions";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";

const CHECKOUT_TITLE = { en: "Checkout", hi: "चेकआउट", mr: "चेकआउट" } as const;

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: true },
};

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`${ROUTES.accountLogin}?redirect=${ROUTES.checkout}`);

  const summary = await getCartSummary();
  if (summary.lines.length === 0) redirect(ROUTES.cart);

  const locale = await getStorefrontLocale();

  return (
    <>
      <PageHero
        eyebrow="Almost There"
        title={CHECKOUT_TITLE[locale]}
        breadcrumbs={[{ label: CHECKOUT_TITLE[locale] }]}
        locale={locale}
      />
      <section className="section pt-0">
        <Container>
          <CheckoutForm customer={customer} summary={summary} />
        </Container>
      </section>
    </>
  );
}
