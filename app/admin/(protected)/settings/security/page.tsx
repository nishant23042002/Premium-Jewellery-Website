import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminGoogleLinkCard } from "@/components/admin/admin-google-link-card";
import { getAdminGoogleLinkStatus } from "@/features/auth/auth.actions";
import { safeQuery } from "@/lib/db/safe-query";

export default async function AdminSecurityPage() {
  const { linked } = await safeQuery(
    () => getAdminGoogleLinkStatus(),
    { linked: false },
  );

  return (
    <div className="mx-auto max-w-(--container-wide) space-y-6">
      <AdminPageHeader
        title="Security"
        description="Sign-in options for your own admin account."
        breadcrumbs={[{ label: "Settings" }, { label: "Security" }]}
      />
      <div className="max-w-xl">
        <AdminGoogleLinkCard linked={linked} />
      </div>
    </div>
  );
}
