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
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";

const LOCAL_TEXT = {
  myAccountEyebrow: { en: "My Account", hi: "मेरा खाता", mr: "माझे खाते" },
  viewOrderHistory: {
    en: "View your order history, tracking, and invoices",
    hi: "अपना ऑर्डर इतिहास, ट्रैकिंग और चालान देखें",
    mr: "तुमचा ऑर्डर इतिहास, ट्रॅकिंग आणि इनव्हॉइस पहा",
  },
  viewReservationBookings: {
    en: "View your showroom visit bookings and their status",
    hi: "अपनी शोरूम विज़िट बुकिंग और उनकी स्थिति देखें",
    mr: "तुमच्या शोरूम भेट बुकिंग आणि त्यांची स्थिती पहा",
  },
} as const;

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: true },
};

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(ROUTES.accountLogin);

  const locale = await getStorefrontLocale();

  return (
    <>
      <PageHero
        eyebrow={LOCAL_TEXT.myAccountEyebrow[locale]}
        title={`Welcome, ${customer.name}`}
        breadcrumbs={[{ label: LOCAL_TEXT.myAccountEyebrow[locale] }]}
        locale={locale}
      >
        <CustomerLogoutButton locale={locale} />
      </PageHero>

      <section className="section pt-0">
        <Container className="max-w-3xl space-y-8">
          <div>
            <h2 className="mb-4 font-heading text-xl">{t("profile", locale)}</h2>
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
                      {t("signedInWithGoogle", locale)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-xl">{t("myOrders", locale)}</h2>
            <Link
              href={ROUTES.accountOrders}
              className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm hover:border-gold/50"
            >
              <Package className="size-5 text-gold" strokeWidth={1.5} />
              <span>{LOCAL_TEXT.viewOrderHistory[locale]}</span>
            </Link>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-xl">{t("myReservations", locale)}</h2>
            <Link
              href={ROUTES.accountReservations}
              className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm hover:border-gold/50"
            >
              <CalendarClock className="size-5 text-gold" strokeWidth={1.5} />
              <span>{LOCAL_TEXT.viewReservationBookings[locale]}</span>
            </Link>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-xl">{t("savedAddresses", locale)}</h2>
            <AddressManager addresses={customer.addresses} />
          </div>
        </Container>
      </section>
    </>
  );
}
