import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrdersTable } from "@/components/admin/orders-table";
import { listOrdersForAdmin } from "@/features/orders/order.actions";
import { safeQuery } from "@/lib/db/safe-query";

export default async function AdminOrdersPage() {
  const orders = await safeQuery(() => listOrdersForAdmin(), []);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Orders"
        description={`${orders.length} total order${orders.length === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Orders" }]}
      />
      <OrdersTable data={orders} />
    </div>
  );
}
