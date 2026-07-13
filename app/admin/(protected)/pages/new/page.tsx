import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CmsPageForm } from "@/components/admin/cms-page-form";
import { ROUTES } from "@/constants/routes";

export default function NewCmsPagePage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Page"
        breadcrumbs={[
          { label: "Pages", href: ROUTES.admin.pages },
          { label: "New" },
        ]}
      />
      <CmsPageForm />
    </div>
  );
}
