import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { listCategories } from "@/features/categories/category.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function NewCategoryPage() {
  const categories = await safeQuery(
    () => listCategories({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Category"
        breadcrumbs={[
          { label: "Categories", href: ROUTES.admin.categories },
          { label: "New" },
        ]}
      />
      <CategoryForm categories={categories} />
    </div>
  );
}
