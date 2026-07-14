"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { ImageOff, Phone } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnquiryStatusSelect } from "@/components/admin/enquiry-status-select";
import { TimeCell } from "@/components/admin/time-cell";
import type { Enquiry } from "@/features/enquiries/enquiry.types";

const columns: ColumnDef<Enquiry>[] = [
  {
    id: "product",
    header: "Product",
    cell: ({ row }) =>
      row.original.productName ? (
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            {row.original.productImageUrl && (
              <Image
                src={row.original.productImageUrl}
                alt={row.original.productName}
                fill
                sizes="56px"
                className="object-cover"
              />
            )}
          </div>
          <span className="max-w-32 truncate text-sm">
            {row.original.productName}
          </span>
        </div>
      ) : (
        <div className="flex size-14 items-center justify-center rounded-lg bg-muted">
          <ImageOff className="size-4 text-muted-foreground/50" />
        </div>
      ),
  },
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <span>{row.original.phone}</span>
        <Button
          variant="outline"
          size="icon-sm"
          nativeButton={false}
          render={
            <a
              href={`tel:${row.original.phone}`}
              aria-label={`Call ${row.original.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Phone />
            </a>
          }
        />
      </div>
    ),
  },
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
    cell: ({ row }) => <TimeCell at={row.original.createdAt} />,
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
