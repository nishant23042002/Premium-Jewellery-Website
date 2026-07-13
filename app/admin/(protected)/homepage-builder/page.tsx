import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HomepageConfigForm } from "@/components/admin/homepage-config-form";
import { getHomepageConfig } from "@/features/homepage/homepage-config.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/features/homepage/homepage-config.types";

export default async function AdminHomepageBuilderPage() {
  const config = await safeQuery(
    () => getHomepageConfig(),
    DEFAULT_HOMEPAGE_CONFIG,
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Homepage Builder"
        description="Control which sections appear on the homepage. Hero banner slides live under Hero Slides."
        breadcrumbs={[{ label: "Homepage Builder" }]}
      />
      <HomepageConfigForm config={config} />
    </div>
  );
}
