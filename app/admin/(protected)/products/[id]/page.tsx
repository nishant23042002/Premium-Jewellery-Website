import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { getProductByIdForAdmin } from "@/features/products/product.actions";
import { listCategories } from "@/features/categories/category.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    safeQuery(() => getProductByIdForAdmin(id), null),
    safeQuery(() => listCategories({ publishedOnly: false }), []),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={product.name.en}
        breadcrumbs={[
          { label: "Products", href: ROUTES.admin.products },
          { label: product.name.en },
        ]}
      />
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
