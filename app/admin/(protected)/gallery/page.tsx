import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GalleryImagesTable } from "@/components/admin/gallery-images-table";
import { Button } from "@/components/ui/button";
import { listGalleryImages } from "@/features/gallery/gallery-image.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminGalleryPage() {
  const images = await safeQuery(
    () => listGalleryImages({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Store Gallery"
        description={`${images.length} image${images.length === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Gallery" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.galleryNew} />}
          >
            <Plus className="size-3.5" />
            Add Image
          </Button>
        }
      />
      <GalleryImagesTable data={images} />
    </div>
  );
}
