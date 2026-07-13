import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AppearanceForm } from "@/components/admin/appearance-form";
import { getAppearanceConfig } from "@/features/settings/appearance.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { DEFAULT_APPEARANCE_CONFIG } from "@/features/settings/appearance.types";

export default async function AdminAppearancePage() {
  const config = await safeQuery(
    () => getAppearanceConfig(),
    DEFAULT_APPEARANCE_CONFIG,
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Appearance"
        description="Logo, favicon, and accent color."
        breadcrumbs={[{ label: "Settings" }, { label: "Appearance" }]}
      />
      <AppearanceForm config={config} />
    </div>
  );
}
