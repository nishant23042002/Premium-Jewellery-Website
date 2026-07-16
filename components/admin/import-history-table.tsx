"use client";

import { useState } from "react";
import { Download, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  exportImportBatchReport,
  undoImportBatch,
} from "@/features/import-export/product-import/product-import.actions";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import { toast } from "@/lib/toast";
import type { ImportBatchSummary } from "@/features/import-export/product-import/import-batch.types";

const STATUS_LABEL: Record<ImportBatchSummary["status"], string> = {
  previewing: "Previewing",
  committing: "Importing…",
  completed: "Completed",
  failed: "Failed",
  undone: "Undone",
};

const STATUS_VARIANT: Record<
  ImportBatchSummary["status"],
  "outline" | "success" | "destructive" | "gold"
> = {
  previewing: "outline",
  committing: "gold",
  completed: "success",
  failed: "destructive",
  undone: "outline",
};

export function ImportHistoryTable({
  batches: initialBatches,
}: {
  batches: ImportBatchSummary[];
}) {
  const [batches, setBatches] = useState(initialBatches);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [undoTarget, setUndoTarget] = useState<ImportBatchSummary | null>(null);

  async function handleDownloadReport(batch: ImportBatchSummary) {
    setDownloadingId(batch.id);
    try {
      const result = await exportImportBatchReport(batch.id);
      if (!result.success) {
        toast.error("Couldn't download report", result.error);
        return;
      }
      const blob = new Blob([result.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${batch.fileName.replace(/\.csv$/i, "")}-report.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't download report", "Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleUndo() {
    if (!undoTarget) return;
    const batch = undoTarget;
    setUndoingId(batch.id);
    try {
      const result = await undoImportBatch(batch.id);
      if (!result.success) {
        toast.error("Couldn't undo import", result.error);
        return;
      }
      const { restoredCount, deletedCount, failedCount } = result.data;
      toast.success(
        `Undone — ${deletedCount} removed, ${restoredCount} restored${failedCount > 0 ? `, ${failedCount} couldn't be undone` : ""}`,
      );
      setBatches((prev) =>
        prev.map((b) => (b.id === batch.id ? { ...b, status: "undone" } : b)),
      );
      setUndoTarget(null);
    } catch {
      toast.error("Couldn't undo import", "Please try again.");
    } finally {
      setUndoingId(null);
    }
  }

  if (batches.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No imports yet — batches you run through the import wizard will show up here.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Results</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="max-w-48 truncate font-medium">
                {batch.fileName}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[batch.status]}>
                  {STATUS_LABEL[batch.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                  <span>{batch.counts.created} created</span>
                  <span>·</span>
                  <span>{batch.counts.updated} updated</span>
                  {batch.counts.skipped > 0 && (
                    <>
                      <span>·</span>
                      <span>{batch.counts.skipped} skipped</span>
                    </>
                  )}
                  {batch.counts.failed > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-destructive">{batch.counts.failed} failed</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell
                className="text-sm text-muted-foreground"
                title={formatDateTime(batch.createdAt)}
              >
                {formatRelativeTime(batch.createdAt)}
              </TableCell>
              <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                {batch.adminEmail}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={downloadingId === batch.id}
                    onClick={() => handleDownloadReport(batch)}
                  >
                    {downloadingId === batch.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    Report
                  </Button>
                  {batch.status === "completed" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setUndoTarget(batch)}
                    >
                      <RotateCcw className="size-3.5" />
                      Undo
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={undoTarget !== null}
        onOpenChange={(open) => !open && setUndoTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo this import?</AlertDialogTitle>
            <AlertDialogDescription>
              {undoTarget && (
                <>
                  Products this import created (
                  {undoTarget.counts.created}) will be moved to the Recycle
                  Bin, and products it updated ({undoTarget.counts.updated})
                  will be restored to how they were before. Any changes made
                  to those products since the import will be lost. This can&apos;t
                  be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={undoingId !== null}
              onClick={handleUndo}
            >
              {undoingId !== null && <Loader2 className="size-3.5 animate-spin" />}
              Undo Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
