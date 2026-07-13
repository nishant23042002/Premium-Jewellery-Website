"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import {
  deleteTestimonial,
  updateTestimonial,
} from "@/features/testimonials/testimonial.actions";
import { ROUTES } from "@/constants/routes";
import type { Testimonial } from "@/features/testimonials/testimonial.types";

const columns: ColumnDef<Testimonial>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "location", header: "Location" },
  { accessorKey: "rating", header: "Rating" },
  {
    id: "quote",
    header: "Quote",
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-72 text-muted-foreground">
        {row.original.quote}
      </span>
    ),
  },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateTestimonial(row.original.id, {
            name: row.original.name,
            location: row.original.location,
            rating: row.original.rating,
            quote: row.original.quote,
            sortOrder: row.original.sortOrder,
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
        editHref={ROUTES.admin.testimonial(row.original.id)}
        itemLabel={row.original.name}
        onDelete={() => deleteTestimonial(row.original.id)}
      />
    ),
  },
];

export function TestimonialsTable({ data }: { data: Testimonial[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="name"
      searchPlaceholder="Search by name..."
    />
  );
}
