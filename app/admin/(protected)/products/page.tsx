import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";
import { listProductsForAdmin } from "@/features/products/product.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminProductsPage() {
  const result = await safeQuery(
    () => listProductsForAdmin({ pageSize: 100 }),
    { items: [], total: 0, page: 1, pageSize: 100, totalPages: 1 },
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Products"
        description={`${result.total} product${result.total === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Products" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.productNew} />}
          >
            <Plus className="size-3.5" />
            New Product
          </Button>
        }
      />
      <ProductsTable data={result.items} />
    </div>
  );
}
