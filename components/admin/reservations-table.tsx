"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { RESERVATION_STATUS_META } from "@/constants/reservation";
import { formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import type { Reservation } from "@/features/reservations/reservation.types";

const columns: ColumnDef<Reservation>[] = [
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
    id: "products",
    header: "Pieces",
    cell: ({ row }) => row.original.products.length || "—",
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
    cell: ({ row }) => formatDate(row.original.createdAt),
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
