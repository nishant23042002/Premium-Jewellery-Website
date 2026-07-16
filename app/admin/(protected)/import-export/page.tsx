import Link from "next/link";
import { Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ImportExportPanel } from "@/components/admin/import-export-panel";
import { ImportHistoryTable } from "@/components/admin/import-history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listImportBatches } from "@/features/import-export/product-import/product-import.actions";
import { ROUTES } from "@/constants/routes";

export default async function AdminImportExportPage() {
  const batches = await listImportBatches();

  return (
    <div className="mx-auto max-w-(--container-wide) space-y-6">
      <AdminPageHeader
        title="Import / Export"
        description="Bulk-manage products via CSV."
        breadcrumbs={[{ label: "Import / Export" }]}
      />

      <Card className="border-gold/30 bg-gold/[0.03]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div>
            <p className="font-medium">Import Wizard</p>
            <p className="text-sm text-muted-foreground">
              Full product import from one CSV — images, videos, collections,
              and SEO included, with a preview before anything is saved.
            </p>
          </div>
          <Button
            variant="gold"
            nativeButton={false}
            render={<Link href={ROUTES.admin.importExportWizard} />}
          >
            <Upload className="size-3.5" />
            Start New Import
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-1 font-heading text-lg">Quick CSV Import / Export</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          For simple, media-free edits (prices, quantities, publish status)
          without the full wizard.
        </p>
        <ImportExportPanel />
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ImportHistoryTable batches={batches} />
        </CardContent>
      </Card>
    </div>
  );
}
