import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BackupDownloadButton } from "@/components/admin/backup-download-button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminBackupsPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Backups"
        description="Download a full snapshot of your catalogue, content, and customer data as a JSON file."
        breadcrumbs={[{ label: "Backups" }]}
      />

      <Card className="max-w-xl border-border/60">
        <CardContent className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            This creates a point-in-time export of products, categories,
            collections, offers, blog posts, FAQ, gallery, pages, testimonials,
            events, reservations, enquiries, customers, and rate history — saved
            to your device. There&apos;s no automatic cloud backup yet, so
            download one periodically and store it somewhere safe.
          </p>
          <BackupDownloadButton />
        </CardContent>
      </Card>
    </div>
  );
}
