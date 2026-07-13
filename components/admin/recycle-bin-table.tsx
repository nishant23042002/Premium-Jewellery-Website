"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw, Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import {
  permanentlyDeleteRecycleBinItem,
  restoreRecycleBinItem,
} from "@/features/recycle-bin/recycle-bin.actions";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/utils/format";
import type { RecycleBinItem } from "@/features/recycle-bin/recycle-bin.types";

function RowActions({ item }: { item: RecycleBinItem }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleRestore() {
    const result = await restoreRecycleBinItem(item.resource, item.id);
    if (!result.success) {
      toast.error("Couldn't restore", result.error);
      return;
    }
    toast.success(`${item.resourceLabel} restored`);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleRestore}>
        <RotateCcw className="size-3.5" />
        Restore
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-3.5" />
        Delete Forever
      </Button>
      <ConfirmDeleteDialog
        itemLabel={item.label}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        description="This permanently removes it — there's no way to undo this."
        confirmLabel="Delete Forever"
        onConfirm={() =>
          permanentlyDeleteRecycleBinItem(item.resource, item.id)
        }
        onDeleted={() => router.refresh()}
      />
    </div>
  );
}

const columns: ColumnDef<RecycleBinItem>[] = [
  {
    accessorKey: "label",
    header: "Item",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.label}</span>
    ),
  },
  {
    id: "resourceLabel",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.resourceLabel}</Badge>
    ),
  },
  {
    id: "deletedAt",
    header: "Deleted",
    cell: ({ row }) => formatDate(row.original.deletedAt),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <RowActions item={row.original} />,
  },
];

export function RecycleBinTable({ data }: { data: RecycleBinItem[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="label"
      searchPlaceholder="Search deleted items..."
    />
  );
}
