import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/marketing/page-hero";
import { AccountReservationsView } from "@/components/storefront/account-reservations-view";
import { listReservationsForCustomer } from "@/features/reservations/reservation.actions";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "My Reservations",
  robots: { index: false, follow: true },
};

export default async function AccountReservationsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(ROUTES.accountLogin);

  const [reservations, locale] = await Promise.all([
    listReservationsForCustomer(),
    getStorefrontLocale(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={t("myAccount", locale)}
        title={t("myReservations", locale)}
        breadcrumbs={[
          { label: t("myAccount", locale), href: ROUTES.account },
          { label: t("myReservations", locale) },
        ]}
        locale={locale}
      />

      <section className="section pt-0">
        <Container className="max-w-3xl">
          <AccountReservationsView
            reservations={reservations}
            prefillCustomer={{
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
            }}
            locale={locale}
          />
        </Container>
      </section>
    </>
  );
}
