import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StylingStoryForm } from "@/components/admin/styling-story-form";
import { getStylingStoryByIdForAdmin } from "@/features/styling-stories/styling-story.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditStylingStoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStylingStoryPage({
  params,
}: EditStylingStoryPageProps) {
  const { id } = await params;
  const story = await safeQuery(() => getStylingStoryByIdForAdmin(id), null);
  if (!story) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Edit Styling Story"
        breadcrumbs={[
          { label: "Styling Stories", href: ROUTES.admin.stylingStories },
          { label: "Edit" },
        ]}
      />
      <StylingStoryForm story={story} />
    </div>
  );
}
