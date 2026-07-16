import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Circle, Truck } from "lucide-react";
import { Container } from "@/components/common/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/marketing/page-hero";
import { OrderItemRow } from "@/components/storefront/order-item-row";
import { getOrderById } from "@/features/orders/order.actions";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { isMadeToOrderOrder } from "@/features/orders/order.types";
import {
  MADE_TO_ORDER_STATUS_CHAIN,
  ORDER_STATUS_LABELS,
  READY_STOCK_STATUS_CHAIN,
} from "@/constants/order-status";
import { formatDate, formatINR } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: true },
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(ROUTES.accountLogin);

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const isMto = isMadeToOrderOrder(order);
  const chain = isMto ? MADE_TO_ORDER_STATUS_CHAIN : READY_STOCK_STATUS_CHAIN;
  const currentIndex = chain.indexOf(order.status);
  const isTerminalOther =
    order.status === "cancelled" || order.status === "refunded";

  return (
    <>
      <PageHero
        eyebrow="My Account"
        title={order.orderNumber}
        breadcrumbs={[
          { label: "My Account", href: ROUTES.account },
          { label: "Orders", href: ROUTES.accountOrders },
          { label: order.orderNumber },
        ]}
      />

      <section className="section pt-0">
        <Container className="max-w-3xl space-y-8">
          {isTerminalOther ? (
            <Card className="border-border/60">
              <CardContent className="pt-2">
                <Badge variant="secondary">
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h2 className="mb-4 font-heading text-lg">Order Timeline</h2>
              <Card className="border-border/60">
                <CardContent className="space-y-3 pt-2">
                  {chain.map((status, i) => {
                    const done = i <= currentIndex;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        {done ? (
                          <CheckCircle2
                            className="size-5 shrink-0 text-green-600"
                            strokeWidth={1.5}
                          />
                        ) : (
                          <Circle
                            className="size-5 shrink-0 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                        )}
                        <span
                          className={
                            done
                              ? "text-sm font-medium"
                              : "text-sm text-muted-foreground"
                          }
                        >
                          {ORDER_STATUS_LABELS[status]}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {(order.trackingNumber || order.courier) && (
            <div>
              <h2 className="mb-4 font-heading text-lg">Shipment</h2>
              <Card className="border-border/60">
                <CardContent className="flex items-center gap-3 pt-2">
                  <Truck className="size-5 text-gold" strokeWidth={1.5} />
                  <div className="text-sm">
                    {order.courier && <p>{order.courier}</p>}
                    {order.trackingNumber && (
                      <p className="text-muted-foreground">
                        Tracking: {order.trackingNumber}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div>
            <h2 className="mb-4 font-heading text-lg">Items</h2>
            <Card className="border-border/60">
              <CardContent className="space-y-4 pt-2">
                {order.items.map((item) => (
                  <OrderItemRow key={item.productId} item={item} />
                ))}
                <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                  <span>Grand Total</span>
                  <span>{formatINR(order.pricing.grandTotal)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-lg">Shipping To</h2>
            <Card className="border-border/60">
              <CardContent className="pt-2 text-sm text-muted-foreground">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && (
                  <p>{order.shippingAddress.line2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.pincode}
                </p>
                <p className="mt-2">Placed on {formatDate(order.createdAt)}</p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
