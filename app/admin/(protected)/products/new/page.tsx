import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { listCategories } from "@/features/categories/category.actions";
import { getCurrentRates } from "@/features/metal-rates/metal-rate.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function NewProductPage() {
  const [categories, currentRates] = await Promise.all([
    safeQuery(() => listCategories({ publishedOnly: false }), []),
    safeQuery(() => getCurrentRates(), { gold: null, silver: null, platinum: null }),
  ]);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Product"
        breadcrumbs={[
          { label: "Products", href: ROUTES.admin.products },
          { label: "New" },
        ]}
      />
      <ProductForm categories={categories} currentRates={currentRates} />
    </div>
  );
}
