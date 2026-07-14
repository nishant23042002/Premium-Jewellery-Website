"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { TimeCell } from "@/components/admin/time-cell";
import type { AuditLogEntry } from "@/features/audit-logs/audit-log.types";

const columns: ColumnDef<AuditLogEntry>[] = [
  {
    id: "at",
    header: "When",
    cell: ({ row }) => <TimeCell at={row.original.at} />,
  },
  { accessorKey: "actorEmail", header: "Who" },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.action.replace(/_/g, " ")}
      </Badge>
    ),
  },
  {
    id: "resource",
    header: "On",
    cell: ({ row }) => (
      <span className="capitalize">
        {row.original.resource.replace(/_/g, " ")}
      </span>
    ),
  },
  {
    id: "resourceLabel",
    header: "Item",
    cell: ({ row }) => row.original.resourceLabel || "—",
  },
];

export function AuditLogsTable({ data }: { data: AuditLogEntry[] }) {
  return <DataTable columns={columns} data={data} />;
}
