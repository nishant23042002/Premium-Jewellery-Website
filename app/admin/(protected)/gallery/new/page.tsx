import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GalleryImageForm } from "@/components/admin/gallery-image-form";
import { ROUTES } from "@/constants/routes";

export default function NewGalleryImagePage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Add Image"
        breadcrumbs={[
          { label: "Gallery", href: ROUTES.admin.gallery },
          { label: "New" },
        ]}
      />
      <GalleryImageForm />
    </div>
  );
}
