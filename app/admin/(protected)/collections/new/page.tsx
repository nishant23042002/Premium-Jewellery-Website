import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CollectionForm } from "@/components/admin/collection-form";
import { ROUTES } from "@/constants/routes";

export default function NewCollectionPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Collection"
        breadcrumbs={[
          { label: "Collections", href: ROUTES.admin.collections },
          { label: "New" },
        ]}
      />
      <CollectionForm />
    </div>
  );
}
