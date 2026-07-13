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

export const metadata: Metadata = {
  title: "Your Cart",
};

export default async function CartPage() {
  const customer = await getCurrentCustomer();
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
        title="Cart"
        breadcrumbs={[{ label: "Cart" }]}
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
                Sign in to view your cart and check out.
              </p>
              <Button
                variant="gold"
                nativeButton={false}
                render={
                  <Link href={`${ROUTES.accountLogin}?redirect=${ROUTES.cart}`}>
                    Sign In
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
                Your cart is empty.
              </p>
              <Button
                variant="gold"
                nativeButton={false}
                render={<Link href={ROUTES.products}>Browse Products</Link>}
              />
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
              <div>
                {summary.lines.map((line) => (
                  <CartLineItem key={line.product.id} line={line} />
                ))}
              </div>

              <div className="h-fit space-y-4 rounded-2xl border border-border p-5">
                <h2 className="font-heading text-lg">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatINR(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {summary.shipping === 0
                        ? "Free"
                        : formatINR(summary.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST</span>
                    <span>{formatINR(summary.tax)}</span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-gold-dark">
                      <span>Discount</span>
                      <span>-{formatINR(summary.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                    <span>Grand Total</span>
                    <span>{formatINR(summary.grandTotal)}</span>
                  </div>
                </div>
                <Button
                  variant="gold"
                  className="w-full"
                  nativeButton={false}
                  render={
                    <Link href={ROUTES.checkout}>Proceed to Checkout</Link>
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
