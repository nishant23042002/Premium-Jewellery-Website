"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { EnquiryStatusSelect } from "@/components/admin/enquiry-status-select";
import { formatDate } from "@/lib/utils/format";
import type { Enquiry } from "@/features/enquiries/enquiry.types";

const columns: ColumnDef<Enquiry>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "phone", header: "Phone" },
  {
    id: "message",
    header: "Message",
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-60 text-muted-foreground">
        {row.original.message || "—"}
      </span>
    ),
  },
  {
    id: "source",
    header: "Source",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.source.replace("_", " ")}
      </Badge>
    ),
  },
  {
    id: "createdAt",
    header: "Received",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <EnquiryStatusSelect
        enquiryId={row.original.id}
        status={row.original.status}
      />
    ),
  },
];

export function EnquiriesTable({ data }: { data: Enquiry[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="name"
      searchPlaceholder="Search by name..."
    />
  );
}
