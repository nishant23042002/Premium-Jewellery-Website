import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ImportExportPanel } from "@/components/admin/import-export-panel";

export default function AdminImportExportPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Import / Export"
        description="Bulk-manage products via CSV."
        breadcrumbs={[{ label: "Import / Export" }]}
      />
      <ImportExportPanel />
    </div>
  );
}
