import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";
import {
  getCategoryByIdForAdmin,
  listCategories,
} from "@/features/categories/category.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;

  const [category, categories] = await Promise.all([
    safeQuery(() => getCategoryByIdForAdmin(id), null),
    safeQuery(() => listCategories({ publishedOnly: false }), []),
  ]);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={category.name.en}
        breadcrumbs={[
          { label: "Categories", href: ROUTES.admin.categories },
          { label: category.name.en },
        ]}
      />
      <CategoryForm category={category} categories={categories} />
    </div>
  );
}
