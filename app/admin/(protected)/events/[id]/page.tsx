import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EventForm } from "@/components/admin/event-form";
import { getEventByIdForAdmin } from "@/features/events/event.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const event = await safeQuery(() => getEventByIdForAdmin(id), null);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={event.title.en}
        breadcrumbs={[
          { label: "Events", href: ROUTES.admin.events },
          { label: event.title.en },
        ]}
      />
      <EventForm event={event} />
    </div>
  );
}
