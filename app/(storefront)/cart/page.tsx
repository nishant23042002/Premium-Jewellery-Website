import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/marketing/page-hero";
import { CartLineItem } from "@/components/storefront/cart-line-item";
import { getCartSummary } from "@/features/cart/cart.actions";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { formatINR } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const [customer, locale] = await Promise.all([
    getCurrentCustomer(),
    getStorefrontLocale(),
  ]);
  const summary = customer
    ? await getCartSummary()
    : {
        lines: [],
        unavailableProductIds: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        discount: 0,
        grandTotal: 0,
      };

  return (
    <>
      <PageHero
        eyebrow="Your Selection"
        title={t("yourCart", locale)}
        breadcrumbs={[{ label: t("yourCart", locale) }]}
        locale={locale}
      />

      <section className="section pt-0">
        <Container>
          {!customer ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <ShoppingBag
                className="mx-auto mb-4 size-8 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="mb-4 text-sm text-muted-foreground">
                {t("signInToViewCart", locale)}
              </p>
              <Button
                variant="gold"
                nativeButton={false}
                render={
                  <Link href={`${ROUTES.accountLogin}?redirect=${ROUTES.cart}`}>
                    {t("signIn", locale)}
                  </Link>
                }
              />
            </div>
          ) : summary.lines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <ShoppingBag
                className="mx-auto mb-4 size-8 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="mb-4 text-sm text-muted-foreground">
                {t("yourCartIsEmpty", locale)}
              </p>
              <Button
                variant="gold"
                nativeButton={false}
                render={<Link href={ROUTES.products}>{t("browseProducts", locale)}</Link>}
              />
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
              <div>
                {summary.lines.map((line) => (
                  <CartLineItem key={line.product.id} line={line} locale={locale} />
                ))}
              </div>

              <div className="h-fit space-y-4 rounded-2xl border border-border p-5">
                <h2 className="font-heading text-lg">{t("orderSummary", locale)}</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("subtotal", locale)}</span>
                    <span>{formatINR(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("shipping", locale)}</span>
                    <span>
                      {summary.shipping === 0
                        ? t("free", locale)
                        : formatINR(summary.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("gstLabel", locale)}</span>
                    <span>{formatINR(summary.tax)}</span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-gold-dark">
                      <span>{t("discount", locale)}</span>
                      <span>-{formatINR(summary.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                    <span>{t("grandTotal", locale)}</span>
                    <span>{formatINR(summary.grandTotal)}</span>
                  </div>
                </div>
                <Button
                  variant="gold"
                  className="w-full"
                  nativeButton={false}
                  render={
                    <Link href={ROUTES.checkout}>{t("proceedToCheckout", locale)}</Link>
                  }
                />
              </div>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
