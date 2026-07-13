import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GalleryImageForm } from "@/components/admin/gallery-image-form";
import { getGalleryImageByIdForAdmin } from "@/features/gallery/gallery-image.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditGalleryImagePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGalleryImagePage({
  params,
}: EditGalleryImagePageProps) {
  const { id } = await params;
  const image = await safeQuery(() => getGalleryImageByIdForAdmin(id), null);
  if (!image) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Edit Image"
        breadcrumbs={[
          { label: "Gallery", href: ROUTES.admin.gallery },
          { label: "Edit" },
        ]}
      />
      <GalleryImageForm image={image} />
    </div>
  );
}
