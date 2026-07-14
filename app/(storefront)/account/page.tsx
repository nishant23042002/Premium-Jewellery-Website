import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, Package, User } from "lucide-react";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { AddressManager } from "@/components/storefront/address-manager";
import { CustomerLogoutButton } from "@/components/storefront/customer-logout-button";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "My Account",
};

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(ROUTES.accountLogin);

  return (
    <>
      <PageHero
        eyebrow="My Account"
        title={`Welcome, ${customer.name}`}
        breadcrumbs={[{ label: "My Account" }]}
      >
        <CustomerLogoutButton />
      </PageHero>

      <section className="section pt-0">
        <Container className="max-w-3xl space-y-8">
          <div>
            <h2 className="mb-4 font-heading text-xl">Profile</h2>
            <Card className="border-border/60">
              <CardContent className="flex items-center gap-3 pt-2">
                <User className="size-5 text-gold" strokeWidth={1.5} />
                <div className="text-sm">
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-muted-foreground">{customer.email}</p>
                  {customer.phone && (
                    <p className="text-muted-foreground">{customer.phone}</p>
                  )}
                  {customer.authProvider === "google" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Signed in with Google
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-xl">My Orders</h2>
            <Link
              href={ROUTES.accountOrders}
              className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm hover:border-gold/50"
            >
              <Package className="size-5 text-gold" strokeWidth={1.5} />
              <span>View your order history, tracking, and invoices</span>
            </Link>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-xl">My Reservations</h2>
            <Link
              href={ROUTES.accountReservations}
              className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm hover:border-gold/50"
            >
              <CalendarClock className="size-5 text-gold" strokeWidth={1.5} />
              <span>View your showroom visit bookings and their status</span>
            </Link>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-xl">Saved Addresses</h2>
            <AddressManager addresses={customer.addresses} />
          </div>
        </Container>
      </section>
    </>
  );
}
