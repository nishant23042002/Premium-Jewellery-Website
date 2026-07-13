"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { deleteRole } from "@/features/roles/role.actions";
import { ROUTES } from "@/constants/routes";
import type { Role } from "@/features/roles/role.types";

const columns: ColumnDef<Role>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="flex items-center gap-2 font-medium">
        {row.original.name}
        {row.original.isSystem && <Badge variant="outline">Built-in</Badge>}
      </span>
    ),
  },
  { accessorKey: "slug", header: "Slug" },
  {
    id: "permissions",
    header: "Permissions",
    cell: ({ row }) => `${row.original.permissions.length} granted`,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <DataTableRowActions
        editHref={ROUTES.admin.role(row.original.id)}
        itemLabel={row.original.name}
        onDelete={
          row.original.isSystem ? undefined : () => deleteRole(row.original.id)
        }
      />
    ),
  },
];

export function RolesTable({ data }: { data: Role[] }) {
  return <DataTable columns={columns} data={data} />;
}
