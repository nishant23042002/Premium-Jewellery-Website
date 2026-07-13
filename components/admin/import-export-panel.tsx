"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  exportProductsCsv,
  importProductsCsv,
  type ImportSummary,
} from "@/features/import-export/product-csv.actions";
import { toast } from "@/lib/toast";

export function ImportExportPanel() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setIsExporting(true);
    try {
      const result = await exportProductsCsv();
      if (!result.success) {
        toast.error("Couldn't export", result.error);
        return;
      }
      const blob = new Blob([result.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ambika-products.csv";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Products exported");
    } catch (error) {
      toast.error(
        "Couldn't export",
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsImporting(true);
    setSummary(null);

    file
      .text()
      .then((text) => importProductsCsv(text))
      .then((result) => {
        if (!result.success) {
          toast.error("Import failed", result.error);
          return;
        }
        setSummary(result.data);
        toast.success(
          `Imported: ${result.data.created} created, ${result.data.updated} updated`,
        );
      })
      .catch((error) => {
        toast.error(
          "Import failed",
          error instanceof Error ? error.message : "Something went wrong.",
        );
      })
      .finally(() => setIsImporting(false));
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-xl border-border/60">
        <CardHeader>
          <CardTitle>Export Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Download every product as a CSV spreadsheet — good for bulk editing
            in Excel/Sheets, or as a backup of your catalogue&apos;s core
            fields.
          </p>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export to CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-xl border-border/60">
        <CardHeader>
          <CardTitle>Import Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Upload a CSV in the same format as the export. Rows with a matching{" "}
            <code className="rounded bg-muted px-1">slug</code> update the
            existing product; new slugs create a new one. Photos and videos
            aren&apos;t part of the CSV — add those from the product&apos;s edit
            page after import.
          </p>
          <Button
            variant="gold"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {summary && (
            <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
              <div className="flex gap-2">
                <Badge variant="success">{summary.created} created</Badge>
                <Badge variant="outline">{summary.updated} updated</Badge>
                {summary.errors.length > 0 && (
                  <Badge variant="destructive">
                    {summary.errors.length} errors
                  </Badge>
                )}
              </div>
              {summary.errors.length > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                  {summary.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
