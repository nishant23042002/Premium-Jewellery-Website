"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import type { ActionResult } from "@/types/common";

interface DataTableRowActionsProps {
  editHref?: string;
  itemLabel: string;
  onDelete?: () => Promise<ActionResult>;
}

/** Row-level "⋯" menu (Edit / Delete) reused across every admin DataTable. */
export function DataTableRowActions({
  editHref,
  itemLabel,
  onDelete,
}: DataTableRowActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {editHref && (
            <DropdownMenuItem render={<Link href={editHref} />}>
              <Pencil className="size-3.5" />
              Edit
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {onDelete && (
        <ConfirmDeleteDialog
          itemLabel={itemLabel}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={onDelete}
          onDeleted={() => router.refresh()}
        />
      )}
    </>
  );
}
