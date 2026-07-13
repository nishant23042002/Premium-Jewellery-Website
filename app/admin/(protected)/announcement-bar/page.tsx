import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AnnouncementBarForm } from "@/components/admin/announcement-bar-form";
import { getAnnouncementBar } from "@/features/announcement-bar/announcement-bar.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { DEFAULT_ANNOUNCEMENT_BAR } from "@/features/announcement-bar/announcement-bar.types";

export default async function AdminAnnouncementBarPage() {
  const config = await safeQuery(
    () => getAnnouncementBar(),
    DEFAULT_ANNOUNCEMENT_BAR,
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Announcement Bar"
        description="A thin banner above the gold-rate ticker for time-sensitive notices."
        breadcrumbs={[{ label: "Announcement Bar" }]}
      />
      <AnnouncementBarForm config={config} />
    </div>
  );
}
