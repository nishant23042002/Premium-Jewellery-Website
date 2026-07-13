"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateBackup } from "@/features/backups/backup.actions";
import { toast } from "@/lib/toast";

export function BackupDownloadButton() {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const result = await generateBackup();
      if (!result.success) {
        toast.error("Couldn't generate backup", result.error);
        return;
      }

      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ambika-backup-${result.data.generatedAt.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Backup downloaded");
    } catch {
      toast.error("Couldn't generate backup", "Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button variant="gold" onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Generate & Download Backup
    </Button>
  );
}
