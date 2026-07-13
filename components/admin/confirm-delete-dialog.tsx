"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/toast";
import type { ActionResult } from "@/types/common";

interface ConfirmDeleteDialogProps {
  itemLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<ActionResult>;
  /** Defaults to a Recycle Bin-aware message; override for permanent (recycle bin "delete forever") actions. */
  description?: string;
  confirmLabel?: string;
  onDeleted?: () => void;
}

/** Controlled confirm-then-delete dialog — the caller owns the open state so it can be triggered from a dropdown item, a button, or anywhere else without nested Base UI trigger composition. */
export function ConfirmDeleteDialog({
  itemLabel,
  open,
  onOpenChange,
  onConfirm,
  description,
  confirmLabel = "Delete",
  onDeleted,
}: ConfirmDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await onConfirm();
      if (!result.success) {
        toast.error("Couldn't delete", result.error);
        return;
      }
      toast.success(`${itemLabel} deleted`);
      onOpenChange(false);
      onDeleted?.();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            {description ??
              "This moves it to the Recycle Bin — you can restore it later, or delete it permanently from there."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
