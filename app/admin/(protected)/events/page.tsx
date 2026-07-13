import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EventsTable } from "@/components/admin/events-table";
import { Button } from "@/components/ui/button";
import { listEvents } from "@/features/events/event.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminEventsPage() {
  const events = await safeQuery(
    () => listEvents({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Events"
        description={`${events.length} event${events.length === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Events" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.eventNew} />}
          >
            <Plus className="size-3.5" />
            New Event
          </Button>
        }
      />
      <EventsTable data={events} />
    </div>
  );
}
