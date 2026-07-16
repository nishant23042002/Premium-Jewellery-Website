"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportImportBatchReport } from "@/features/import-export/product-import/product-import.actions";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { ImportBatch } from "@/features/import-export/product-import/import-batch.types";

interface ReportStepProps {
  batch: ImportBatch;
  onStartOver: () => void;
}

export function ReportStep({ batch, onStartOver }: ReportStepProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { created, updated, skipped, failed, mediaUploaded, mediaFailed } = batch.counts;

  async function handleDownload() {
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
      link.download = `${batch.fileName.replace(/\.csv$/i, "")}-report.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="size-10 text-success" strokeWidth={1.5} />
        <p className="font-heading text-xl">Import complete</p>
        <p className="text-sm text-muted-foreground">{batch.fileName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-semibold tabular-nums">{created}</p>
          <p className="text-xs text-muted-foreground">Created</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-semibold tabular-nums">{updated}</p>
          <p className="text-xs text-muted-foreground">Updated</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-semibold tabular-nums">{skipped}</p>
          <p className="text-xs text-muted-foreground">Skipped</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-semibold tabular-nums text-destructive">{failed}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
      </div>

      {(mediaUploaded > 0 || mediaFailed > 0) && (
        <div className="flex justify-center gap-2">
          <Badge variant="success">{mediaUploaded} images/videos uploaded</Badge>
          {mediaFailed > 0 && (
            <Badge variant="destructive">{mediaFailed} media failed</Badge>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Download Full Report
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href={ROUTES.admin.products} />}>
          View Products
        </Button>
        <Button variant="gold" onClick={onStartOver}>
          Import Another File
        </Button>
      </div>
    </div>
  );
}
