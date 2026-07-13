"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import type { Customer } from "@/features/customers/customer.types";

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={ROUTES.admin.customer(row.original.id)}
        className="font-medium hover:text-gold-dark"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "phone", header: "Phone" },
  {
    id: "activity",
    header: "Activity",
    cell: ({ row }) =>
      `${row.original.totalReservations} reservation${row.original.totalReservations === 1 ? "" : "s"} · ${row.original.totalEnquiries} enquir${row.original.totalEnquiries === 1 ? "y" : "ies"}`,
  },
  {
    id: "lastContactAt",
    header: "Last Contact",
    cell: ({ row }) => formatDate(row.original.lastContactAt),
  },
];

export function CustomersTable({ data }: { data: Customer[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="name"
      searchPlaceholder="Search by name or phone..."
    />
  );
}
