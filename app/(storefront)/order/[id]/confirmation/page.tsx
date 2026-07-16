import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderItemRow } from "@/components/storefront/order-item-row";
import { getOrderById } from "@/features/orders/order.actions";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { formatINR } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: true },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(ROUTES.accountLogin);

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const locale = await getStorefrontLocale();

  return (
    <section className="section">
      <Container className="max-w-lg text-center">
        <CheckCircle2
          className="mx-auto mb-4 size-12 text-green-600"
          strokeWidth={1.5}
        />
        <h1 className="font-heading text-2xl">{t("orderConfirmed", locale)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("orderConfirmedDesc", locale)} (
          <strong>{order.orderNumber}</strong>)
        </p>

        <Card className="mt-8 border-border/60 text-left">
          <CardContent className="space-y-4 pt-2">
            {order.items.map((item) => (
              <OrderItemRow key={item.productId} item={item} />
            ))}
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <span>{t("grandTotal", locale)}</span>
              <span>{formatINR(order.pricing.grandTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="gold"
            nativeButton={false}
            render={
              <Link href={ROUTES.accountOrder(order.id)}>{t("trackOrder", locale)}</Link>
            }
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.products}>{t("continueShopping", locale)}</Link>}
          />
        </div>
      </Container>
    </section>
  );
}
