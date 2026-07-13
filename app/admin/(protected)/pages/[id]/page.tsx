import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CmsPageForm } from "@/components/admin/cms-page-form";
import { getCmsPageByIdForAdmin } from "@/features/pages/page.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditCmsPagePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCmsPagePage({
  params,
}: EditCmsPagePageProps) {
  const { id } = await params;
  const page = await safeQuery(() => getCmsPageByIdForAdmin(id), null);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={page.title.en}
        breadcrumbs={[
          { label: "Pages", href: ROUTES.admin.pages },
          { label: page.title.en },
        ]}
      />
      <CmsPageForm page={page} />
    </div>
  );
}
