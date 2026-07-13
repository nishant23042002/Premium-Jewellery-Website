import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CustomersTable } from "@/components/admin/customers-table";
import { listCustomers } from "@/features/customers/customer.actions";
import { safeQuery } from "@/lib/db/safe-query";

export default async function AdminCustomersPage() {
  const result = await safeQuery(() => listCustomers({ pageSize: 100 }), {
    items: [],
    total: 0,
    page: 1,
    pageSize: 100,
    totalPages: 1,
  });

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Customers"
        description={`${result.total} customer${result.total === 1 ? "" : "s"} — built automatically from reservations and enquiries`}
        breadcrumbs={[{ label: "Customers" }]}
      />
      <CustomersTable data={result.items} />
    </div>
  );
}
