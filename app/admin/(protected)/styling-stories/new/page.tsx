import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StylingStoryForm } from "@/components/admin/styling-story-form";
import { ROUTES } from "@/constants/routes";

export default function AdminStylingStoryNewPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Add Styling Story"
        breadcrumbs={[
          { label: "Styling Stories", href: ROUTES.admin.stylingStories },
          { label: "New" },
        ]}
      />
      <StylingStoryForm />
    </div>
  );
}
