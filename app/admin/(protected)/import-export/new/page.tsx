import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ImportWizard } from "@/components/admin/import-wizard/import-wizard";
import { ROUTES } from "@/constants/routes";

export default function AdminImportWizardPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Import Products"
        description="Upload a CSV with products, images, videos, collections, and SEO — all in one go."
        breadcrumbs={[
          { label: "Import / Export", href: ROUTES.admin.importExport },
          { label: "Import Products" },
        ]}
      />
      <ImportWizard />
    </div>
  );
}
