import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { OrderTrackingForm } from "@/components/admin/order-tracking-form";
import { getOrderByIdForAdmin } from "@/features/orders/order.actions";
import { ROUTES } from "@/constants/routes";
import { isMadeToOrderOrder } from "@/features/orders/order.types";
import { ORDER_STATUS_LABELS } from "@/constants/order-status";
import { formatDate, formatINR } from "@/lib/utils/format";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderByIdForAdmin(id);
  if (!order) notFound();

  const isMto = isMadeToOrderOrder(order);

  return (
    <div className="mx-auto max-w-(--container-wide) space-y-6">
      <AdminPageHeader
        title={order.orderNumber}
        description={`Placed ${formatDate(order.createdAt)} by ${order.customerSnapshot.name}`}
        breadcrumbs={[
          { label: "Orders", href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
      />

      <Card className="border-border/60">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{ORDER_STATUS_LABELS[order.status]}</Badge>
            {isMto && <Badge variant="secondary">Made to Order</Badge>}
          </div>
          <OrderStatusActions
            orderId={order.id}
            orderNumber={order.orderNumber}
            status={order.status}
            grandTotal={order.pricing.grandTotal}
            isMadeToOrder={isMto}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="space-y-4 pt-2">
            <h2 className="font-heading text-lg">Items</h2>
            {order.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 text-sm"
              >
                <Link
                  href={ROUTES.product(item.slug)}
                  className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted"
                >
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={ROUTES.product(item.slug)}
                    className="block truncate font-medium hover:text-gold-dark"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Qty {item.quantity}
                    {item.skuCode && ` · SKU ${item.skuCode}`}
                    {item.isMadeToOrder && (
                      <span className="text-gold-dark"> · Made to Order</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 font-medium">
                  {formatINR(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>Grand Total</span>
              <span>{formatINR(order.pricing.grandTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-3 pt-2">
            <h2 className="font-heading text-lg">Customer</h2>
            <p className="text-sm">{order.customerSnapshot.name}</p>
            <p className="text-sm text-muted-foreground">
              {order.customerSnapshot.email}
            </p>
            {order.customerSnapshot.phone && (
              <p className="text-sm text-muted-foreground">
                {order.customerSnapshot.phone}
              </p>
            )}
            <div className="border-t border-border pt-3 text-sm text-muted-foreground">
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && (
                <p>{order.shippingAddress.line2}</p>
              )}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                {order.shippingAddress.pincode}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-3 pt-2">
            <h2 className="font-heading text-lg">Payment</h2>
            <p className="text-sm">
              Status:{" "}
              <span className="font-medium">{order.payment.status}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Razorpay Order: {order.payment.razorpayOrderId}
            </p>
            {order.payment.razorpayPaymentId && (
              <p className="text-sm text-muted-foreground">
                Payment ID: {order.payment.razorpayPaymentId}
              </p>
            )}
            {order.payment.verifiedAt && (
              <p className="text-sm text-muted-foreground">
                Verified {formatDate(order.payment.verifiedAt)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-3 pt-2">
            <h2 className="font-heading text-lg">Tracking</h2>
            <OrderTrackingForm
              orderId={order.id}
              trackingNumber={order.trackingNumber}
              courier={order.courier}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardContent className="space-y-3 pt-2">
          <h2 className="font-heading text-lg">Status History</h2>
          {[...order.statusHistory].reverse().map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0"
            >
              <span>{ORDER_STATUS_LABELS[entry.status]}</span>
              <span className="text-muted-foreground">
                {formatDate(entry.at)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
