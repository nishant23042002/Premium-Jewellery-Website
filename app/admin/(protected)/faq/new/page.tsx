import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FaqItemForm } from "@/components/admin/faq-item-form";
import { ROUTES } from "@/constants/routes";

export default function NewFaqItemPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New FAQ Item"
        breadcrumbs={[
          { label: "FAQ", href: ROUTES.admin.faq },
          { label: "New" },
        ]}
      />
      <FaqItemForm />
    </div>
  );
}
