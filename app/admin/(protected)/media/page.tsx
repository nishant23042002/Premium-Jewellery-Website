import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MediaGrid } from "@/components/admin/media-grid";
import { listMediaAssets } from "@/features/media/media.actions";
import { safeQuery } from "@/lib/db/safe-query";

export default async function AdminMediaPage() {
  const result = await safeQuery(() => listMediaAssets({ pageSize: 100 }), {
    items: [],
    total: 0,
    page: 1,
    pageSize: 100,
    totalPages: 1,
  });

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Media Library"
        description="Every image uploaded across the admin panel, in one place."
        breadcrumbs={[{ label: "Media" }]}
      />
      <MediaGrid initialAssets={result.items} />
    </div>
  );
}
