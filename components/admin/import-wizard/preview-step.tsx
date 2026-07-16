"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportImportBatchReport } from "@/features/import-export/product-import/product-import.actions";
import { toast } from "@/lib/toast";
import type { ImportBatch } from "@/features/import-export/product-import/import-batch.types";

const VISIBLE_ROW_CAP = 200;

const STATUS_ICON = {
  valid: <CheckCircle2 className="size-4 text-success" />,
  warning: <AlertTriangle className="size-4 text-warning" />,
  error: <XCircle className="size-4 text-destructive" />,
  pending: null,
  skipped: null,
  committed: null,
};

interface PreviewStepProps {
  batch: ImportBatch;
  onStartImport: () => void;
  onStartOver: () => void;
  isLoading: boolean;
}

export function PreviewStep({ batch, onStartImport, onStartOver, isLoading }: PreviewStepProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const validCount = batch.rows.filter((r) => r.status === "valid").length;
  const warningCount = batch.rows.filter((r) => r.status === "warning").length;
  const errorCount = batch.rows.filter((r) => r.status === "error").length;
  const createCount = batch.rows.filter((r) => r.plannedAction === "create").length;
  const updateCount = batch.rows.filter((r) => r.plannedAction === "update").length;
  const committableCount = validCount + warningCount;

  const visibleRows = batch.rows.slice(0, VISIBLE_ROW_CAP);

  async function handleDownloadReport() {
    setIsDownloading(true);
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
      link.download = `${batch.fileName.replace(/\.csv$/i, "")}-preview.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      {batch.mode === "update" && (
        <p className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-sm text-gold-dark">
          Bulk Update Mode — only the columns present in your file will
          change. Every row updates an existing product by SKU; nothing new
          is created.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {batch.mode === "full" && <Badge variant="success">{createCount} to create</Badge>}
        <Badge variant="outline">{updateCount} to update</Badge>
        {warningCount > 0 && <Badge variant="gold">{warningCount} warnings</Badge>}
        {errorCount > 0 && (
          <Badge variant="destructive">{errorCount} errors — will be skipped</Badge>
        )}
      </div>

      {errorCount > 0 && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Rows with errors won&apos;t be imported. Download the report below,
          fix those rows in your CSV, and upload it again — everything else
          will still import normally.
        </p>
      )}

      <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-border" data-lenis-prevent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Row</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.rowNumber}>
                <TableCell>{STATUS_ICON[row.status]}</TableCell>
                <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                <TableCell className="max-w-40 truncate">
                  {row.normalizedData?.name.en ||
                    (batch.fieldMapping.name_en
                      ? row.sourceData[batch.fieldMapping.name_en]
                      : undefined) ||
                    "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.normalizedData?.skuCode ||
                    (batch.fieldMapping.skuCode
                      ? row.sourceData[batch.fieldMapping.skuCode]
                      : undefined) ||
                    "—"}
                </TableCell>
                <TableCell>
                  {row.plannedAction === "update" ? (
                    <Badge variant="outline">Update</Badge>
                  ) : row.plannedAction === "create" ? (
                    <Badge variant="success">Create</Badge>
                  ) : (
                    <Badge variant="destructive">Skip</Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-72 truncate text-xs text-muted-foreground">
                  {row.errors.length > 0
                    ? row.errors.join("; ")
                    : row.warnings.length > 0
                      ? row.warnings.join("; ")
                      : "Looks good"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {batch.rows.length > VISIBLE_ROW_CAP && (
        <p className="text-xs text-muted-foreground">
          Showing the first {VISIBLE_ROW_CAP} of {batch.rows.length} rows — every
          row will still be processed when you start the import.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onStartOver} disabled={isLoading}>
            Upload a Different File
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadReport}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Download Row Report
          </Button>
        </div>
        <Button
          variant="gold"
          onClick={onStartImport}
          disabled={isLoading || committableCount === 0}
        >
          {isLoading && <Loader2 className="size-3.5 animate-spin" />}
          Import {committableCount} Product{committableCount === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}
