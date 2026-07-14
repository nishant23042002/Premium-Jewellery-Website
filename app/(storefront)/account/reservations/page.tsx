import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/marketing/page-hero";
import { AccountReservationsView } from "@/components/storefront/account-reservations-view";
import { listReservationsForCustomer } from "@/features/reservations/reservation.actions";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "My Reservations",
};

export default async function AccountReservationsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(ROUTES.accountLogin);

  const reservations = await listReservationsForCustomer();

  return (
    <>
      <PageHero
        eyebrow="My Account"
        title="My Reservations"
        breadcrumbs={[
          { label: "My Account", href: ROUTES.account },
          { label: "Reservations" },
        ]}
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
          />
        </Container>
      </section>
    </>
  );
}
