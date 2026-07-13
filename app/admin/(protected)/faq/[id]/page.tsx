import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FaqItemForm } from "@/components/admin/faq-item-form";
import { getFaqItemByIdForAdmin } from "@/features/faq/faq-item.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditFaqItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFaqItemPage({
  params,
}: EditFaqItemPageProps) {
  const { id } = await params;
  const item = await safeQuery(() => getFaqItemByIdForAdmin(id), null);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={item.question.en}
        breadcrumbs={[
          { label: "FAQ", href: ROUTES.admin.faq },
          { label: item.question.en },
        ]}
      />
      <FaqItemForm item={item} />
    </div>
  );
}
