import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/marketing/page-hero";
import { listOrdersForCustomer } from "@/features/orders/order.actions";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { formatDate, formatINR } from "@/lib/utils/format";
import { ORDER_STATUS_LABELS } from "@/constants/order-status";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false, follow: true },
};

const MORE_SUFFIX = { en: "more", hi: "और", mr: "अधिक" } as const;

export default async function AccountOrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(ROUTES.accountLogin);

  const [orders, locale] = await Promise.all([
    listOrdersForCustomer(),
    getStorefrontLocale(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={t("myAccount", locale)}
        title={t("myOrders", locale)}
        breadcrumbs={[
          { label: t("myAccount", locale), href: ROUTES.account },
          { label: t("myOrders", locale) },
        ]}
        locale={locale}
      />

      <section className="section pt-0">
        <Container className="max-w-3xl">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <Package
                className="mx-auto mb-4 size-8 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="text-sm text-muted-foreground">
                {t("haventPlacedOrders", locale)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const firstItem = order.items[0];
                const extraCount = order.items.length - 1;
                return (
                  <Link key={order.id} href={ROUTES.accountOrder(order.id)}>
                    <Card className="border-border/60 transition-colors hover:border-gold/50">
                      <CardContent className="flex items-center justify-between gap-4 pt-2">
                        <div className="flex min-w-0 items-center gap-3">
                          {firstItem && (
                            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {firstItem.imageUrl && (
                                <Image
                                  src={firstItem.imageUrl}
                                  alt={firstItem.name}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {firstItem?.name}
                              {extraCount > 0 && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  +{extraCount} {MORE_SUFFIX[locale]}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">
                            {formatINR(order.pricing.grandTotal)}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {ORDER_STATUS_LABELS[order.status]}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
