import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoForm } from "@/components/admin/seo-form";
import { getSeoConfig } from "@/features/settings/seo.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { DEFAULT_SEO_CONFIG } from "@/features/settings/seo.types";

export default async function AdminSeoPage() {
  const config = await safeQuery(() => getSeoConfig(), DEFAULT_SEO_CONFIG);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="SEO"
        description="Default meta title, description, and social share image."
        breadcrumbs={[{ label: "Settings" }, { label: "SEO" }]}
      />
      <SeoForm config={config} />
    </div>
  );
}
