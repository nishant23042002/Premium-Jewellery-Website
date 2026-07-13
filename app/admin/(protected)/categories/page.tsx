import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoriesTable } from "@/components/admin/categories-table";
import { Button } from "@/components/ui/button";
import { listCategories } from "@/features/categories/category.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminCategoriesPage() {
  const categories = await safeQuery(
    () => listCategories({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Categories"
        description={`${categories.length} categor${categories.length === 1 ? "y" : "ies"}`}
        breadcrumbs={[{ label: "Categories" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.categoryNew} />}
          >
            <Plus className="size-3.5" />
            New Category
          </Button>
        }
      />
      <CategoriesTable data={categories} />
    </div>
  );
}
