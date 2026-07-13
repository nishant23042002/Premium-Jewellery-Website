import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EventForm } from "@/components/admin/event-form";
import { ROUTES } from "@/constants/routes";

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Event"
        breadcrumbs={[
          { label: "Events", href: ROUTES.admin.events },
          { label: "New" },
        ]}
      />
      <EventForm />
    </div>
  );
}
