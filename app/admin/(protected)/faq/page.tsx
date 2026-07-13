import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FaqItemsTable } from "@/components/admin/faq-items-table";
import { Button } from "@/components/ui/button";
import { listFaqItems } from "@/features/faq/faq-item.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminFaqPage() {
  const items = await safeQuery(
    () => listFaqItems({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="FAQ"
        description={`${items.length} item${items.length === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "FAQ" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.faqNew} />}
          >
            <Plus className="size-3.5" />
            New Item
          </Button>
        }
      />
      <FaqItemsTable data={items} />
    </div>
  );
}
