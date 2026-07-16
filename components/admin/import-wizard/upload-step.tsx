"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImportMode } from "@/features/import-export/product-import/import-batch.types";

interface UploadStepProps {
  mode: ImportMode;
  onModeChange: (mode: ImportMode) => void;
  onFileSelected: (fileName: string, csvText: string) => void;
  isLoading: boolean;
}

const MODE_OPTIONS: { value: ImportMode; title: string; description: string; icon: typeof Upload }[] = [
  {
    value: "full",
    title: "Full Import",
    description: "Create new products, or fully update matched ones — every column in your file.",
    icon: Upload,
  },
  {
    value: "update",
    title: "Update Existing Products",
    description: "Patch only the columns you include (e.g. price, stock) by SKU. Never creates a product.",
    icon: RefreshCw,
  },
];

/** Drag-and-drop CSV upload zone — same native HTML5 drag-event pattern as MediaPicker's image dropzone, no library. */
export function UploadStep({ mode, onModeChange, onFileSelected, isLoading }: UploadStepProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const text = await file.text();
    onFileSelected(file.name, text);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = mode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={isLoading}
              onClick={() => onModeChange(option.value)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-gold bg-gold/5"
                  : "border-border hover:border-gold/40",
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  isSelected ? "bg-gold/15 text-gold-dark" : "bg-secondary text-muted-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-medium">{option.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-colors",
          isDraggingOver
            ? "border-gold bg-gold/5"
            : "border-border hover:border-gold/40",
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-8 animate-spin text-gold" />
            <p className="text-sm text-muted-foreground">
              Reading and validating your file…
            </p>
          </>
        ) : (
          <>
            <div className="flex size-14 items-center justify-center rounded-full bg-gold/10">
              <FileSpreadsheet className="size-6 text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-medium">
                Drag and drop your CSV here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gold-dark underline-offset-2 hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Products, images, videos, collections, and SEO — all from one file.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3.5" />
              Choose File
            </Button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Headers matching our template are detected automatically. If they
        don&apos;t match, you&apos;ll be asked to map them on the next step.
      </p>
    </div>
  );
}
