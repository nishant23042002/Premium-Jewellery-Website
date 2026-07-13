import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RecycleBinTable } from "@/components/admin/recycle-bin-table";
import { listRecycleBinItems } from "@/features/recycle-bin/recycle-bin.actions";
import { safeQuery } from "@/lib/db/safe-query";

export default async function AdminRecycleBinPage() {
  const items = await safeQuery(() => listRecycleBinItems(), []);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Recycle Bin"
        description={`${items.length} deleted item${items.length === 1 ? "" : "s"} — restore or delete forever.`}
        breadcrumbs={[{ label: "Recycle Bin" }]}
      />
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing in the recycle bin.
          </p>
        </div>
      ) : (
        <RecycleBinTable data={items} />
      )}
    </div>
  );
}
