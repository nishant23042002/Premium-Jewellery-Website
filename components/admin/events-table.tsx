"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { deleteEvent, updateEvent } from "@/features/events/event.actions";
import { formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import type { StoreEvent } from "@/features/events/event.types";

const columns: ColumnDef<StoreEvent>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title.en}</span>
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.date),
  },
  { accessorKey: "location", header: "Location" },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateEvent(row.original.id, {
            slug: row.original.slug,
            title: row.original.title,
            description: row.original.description,
            date: row.original.date,
            location: row.original.location,
            imageUrl: row.original.imageUrl ?? "",
            isPublished: next,
          })
        }
      />
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <DataTableRowActions
        editHref={ROUTES.admin.event(row.original.id)}
        itemLabel={row.original.title.en}
        onDelete={() => deleteEvent(row.original.id)}
      />
    ),
  },
];

export function EventsTable({ data }: { data: StoreEvent[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="title"
      searchPlaceholder="Search events..."
    />
  );
}
