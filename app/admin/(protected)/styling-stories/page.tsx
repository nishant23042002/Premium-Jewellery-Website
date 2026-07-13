import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StylingStoriesTable } from "@/components/admin/styling-stories-table";
import { Button } from "@/components/ui/button";
import { listStylingStories } from "@/features/styling-stories/styling-story.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminStylingStoriesPage() {
  const stories = await safeQuery(
    () => listStylingStories({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Styling Stories"
        description={`${stories.length} stor${stories.length === 1 ? "y" : "ies"}`}
        breadcrumbs={[{ label: "Styling Stories" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.stylingStoriesNew} />}
          >
            <Plus className="size-3.5" />
            Add Story
          </Button>
        }
      />
      <StylingStoriesTable data={stories} />
    </div>
  );
}
