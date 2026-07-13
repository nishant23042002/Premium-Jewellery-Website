import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CollectionForm } from "@/components/admin/collection-form";
import { getCollectionByIdForAdmin } from "@/features/collections/collection.actions";
import { getProductsByIds } from "@/features/products/product.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditCollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({
  params,
}: EditCollectionPageProps) {
  const { id } = await params;
  const collection = await safeQuery(() => getCollectionByIdForAdmin(id), null);
  if (!collection) notFound();

  const productsWithPrice = await safeQuery(
    () => getProductsByIds(collection.productIds),
    [],
  );
  const initialProducts = productsWithPrice.map(({ product }) => ({
    id: product.id,
    name: product.name.en,
    slug: product.slug,
    imageUrl: product.images[0]?.url,
  }));

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={collection.name.en}
        breadcrumbs={[
          { label: "Collections", href: ROUTES.admin.collections },
          { label: collection.name.en },
        ]}
      />
      <CollectionForm
        collection={collection}
        initialProducts={initialProducts}
      />
    </div>
  );
}
