"use client";

import Image from "next/image";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ImageOff } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { TimeCell } from "@/components/admin/time-cell";
import { RESERVATION_STATUS_META } from "@/constants/reservation";
import { formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import type { Reservation } from "@/features/reservations/reservation.types";

const columns: ColumnDef<Reservation>[] = [
  {
    id: "products",
    header: "Pieces",
    cell: ({ row }) => {
      const products = row.original.products;
      const first = products[0];
      const extraCount = products.length - 1;
      if (!first) {
        return (
          <div className="flex size-14 items-center justify-center rounded-lg bg-muted">
            <ImageOff className="size-4 text-muted-foreground/50" />
          </div>
        );
      }
      return (
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            {first.imageUrl && (
              <Image
                src={first.imageUrl}
                alt={first.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            )}
          </div>
          <span className="max-w-36 truncate text-sm">
            {first.name}
            {extraCount > 0 && (
              <span className="text-muted-foreground"> +{extraCount}</span>
            )}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => (
      <Link
        href={ROUTES.admin.reservation(row.original.id)}
        className="font-medium hover:text-gold-dark"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "phone", header: "Phone" },
  {
    id: "visit",
    header: "Preferred Visit",
    cell: ({ row }) => (
      <span>
        {formatDate(row.original.preferredDate)} ·{" "}
        {row.original.preferredTimeSlot}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const meta = RESERVATION_STATUS_META[row.original.status];
      return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>;
    },
  },
  {
    id: "createdAt",
    header: "Submitted",
    cell: ({ row }) => <TimeCell at={row.original.createdAt} />,
  },
];

export function ReservationsTable({ data }: { data: Reservation[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="name"
      searchPlaceholder="Search by name..."
    />
  );
}
