import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CollectionsTable } from "@/components/admin/collections-table";
import { Button } from "@/components/ui/button";
import { listCollections } from "@/features/collections/collection.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminCollectionsPage() {
  const collections = await safeQuery(
    () => listCollections({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Collections"
        description={`${collections.length} collection${collections.length === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Collections" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.collectionNew} />}
          >
            <Plus className="size-3.5" />
            New Collection
          </Button>
        }
      />
      <CollectionsTable data={collections} />
    </div>
  );
}
