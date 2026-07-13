import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CmsPagesTable } from "@/components/admin/cms-pages-table";
import { Button } from "@/components/ui/button";
import { listCmsPagesForAdmin } from "@/features/pages/page.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminPagesPage() {
  const pages = await safeQuery(() => listCmsPagesForAdmin(), []);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Pages"
        description="Ad-hoc content pages (policies, one-off notices) you can publish without a developer."
        breadcrumbs={[{ label: "Pages" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.pageNew} />}
          >
            <Plus className="size-3.5" />
            New Page
          </Button>
        }
      />
      <CmsPagesTable data={pages} />
    </div>
  );
}
