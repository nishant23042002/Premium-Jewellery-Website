"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import type { AdminUser } from "@/features/auth/admin-user.types";

const columns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={ROUTES.admin.staffMember(row.original.id)}
        className="font-medium hover:text-gold-dark"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "email", header: "Email" },
  {
    id: "role",
    header: "Access",
    cell: ({ row }) => (
      <Badge
        variant={row.original.role === "owner" ? "gold" : "outline"}
        className="capitalize"
      >
        {row.original.role === "staff" && row.original.roleSlug
          ? row.original.roleSlug
          : row.original.role}
      </Badge>
    ),
  },
  {
    id: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "success" : "secondary"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export function StaffTable({ data }: { data: AdminUser[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="name"
      searchPlaceholder="Search by name or email..."
    />
  );
}
