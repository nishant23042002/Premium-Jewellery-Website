import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { listCategories } from "@/features/categories/category.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function NewProductPage() {
  const categories = await safeQuery(
    () => listCategories({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Product"
        breadcrumbs={[
          { label: "Products", href: ROUTES.admin.products },
          { label: "New" },
        ]}
      />
      <ProductForm categories={categories} />
    </div>
  );
}
