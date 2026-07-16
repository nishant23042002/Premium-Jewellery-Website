"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { parseAndValidateImport } from "@/features/import-export/product-import/product-import.actions";
import { toast } from "@/lib/toast";
import { UploadStep } from "@/components/admin/import-wizard/upload-step";
import { MappingStep } from "@/components/admin/import-wizard/mapping-step";
import { PreviewStep } from "@/components/admin/import-wizard/preview-step";
import { CommitStep } from "@/components/admin/import-wizard/commit-step";
import { ReportStep } from "@/components/admin/import-wizard/report-step";
import type {
  ImportBatch,
  ImportMappingRequired,
  ImportMode,
} from "@/features/import-export/product-import/import-batch.types";

type WizardStep = "upload" | "mapping" | "preview" | "committing" | "report";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "committing", label: "Import" },
  { key: "report", label: "Report" },
];

function isMappingRequired(
  data: ImportBatch | ImportMappingRequired,
): data is ImportMappingRequired {
  return "requiresMapping" in data;
}

export function ImportWizard() {
  const [step, setStep] = useState<WizardStep>("upload");
  const [mode, setMode] = useState<ImportMode>("full");
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [mappingRequired, setMappingRequired] = useState<ImportMappingRequired | null>(null);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function runParse(name: string, text: string, mappingOverride?: Record<string, string>) {
    setIsLoading(true);
    try {
      const result = await parseAndValidateImport(name, text, mappingOverride, mode);
      if (!result.success) {
        toast.error("Couldn't process this file", result.error);
        return;
      }
      if (isMappingRequired(result.data)) {
        setMappingRequired(result.data);
        setStep("mapping");
        return;
      }
      setBatch(result.data);
      setMappingRequired(null);
      setStep("preview");
    } catch (error) {
      toast.error(
        "Couldn't process this file",
        error instanceof Error ? error.message : "Unexpected error — please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileSelected(name: string, text: string) {
    setFileName(name);
    setCsvText(text);
    runParse(name, text);
  }

  function handleMappingSubmit(mappingOverride: Record<string, string>) {
    runParse(fileName, csvText, mappingOverride);
  }

  function handleStartOver() {
    setStep("upload");
    setFileName("");
    setCsvText("");
    setMappingRequired(null);
    setBatch(null);
  }

  function handleModeChange(nextMode: ImportMode) {
    setMode(nextMode);
    // A file already read against the old mode's required-fields gate (or
    // an in-progress manual mapping) is no longer trustworthy — safest to
    // have the admin re-drop the file rather than silently reusing stale
    // parse state under a different mode.
    if (fileName || csvText || mappingRequired) handleStartOver();
  }

  // "Import" and "Report" both count as reached once committing has started,
  // so the indicator doesn't jump backward while rows are still processing.
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2">
        {STEPS.map((s, index) => {
          const isDone = index < stepIndex;
          const isCurrent = index === stepIndex;
          return (
            <li key={s.key} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  isCurrent
                    ? "bg-gold/15 text-gold-dark"
                    : isDone
                      ? "text-success"
                      : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border text-[0.65rem]",
                    isCurrent
                      ? "border-gold bg-gold text-gold-foreground"
                      : isDone
                        ? "border-success bg-success text-success-foreground"
                        : "border-border",
                  )}
                >
                  {isDone ? <Check className="size-3" /> : index + 1}
                </span>
                {s.label}
              </div>
              {index < STEPS.length - 1 && (
                <span className="h-px flex-1 bg-border" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      <Card className="border-border/60">
        <CardContent className="pt-2">
          {step === "upload" && (
            <UploadStep
              mode={mode}
              onModeChange={handleModeChange}
              onFileSelected={handleFileSelected}
              isLoading={isLoading}
            />
          )}

          {step === "mapping" && mappingRequired && (
            <MappingStep
              mapping={mappingRequired}
              onSubmit={handleMappingSubmit}
              isLoading={isLoading}
            />
          )}

          {step === "preview" && batch && (
            <PreviewStep
              batch={batch}
              onStartImport={() => setStep("committing")}
              onStartOver={handleStartOver}
              isLoading={isLoading}
            />
          )}

          {step === "committing" && batch && (
            <CommitStep
              batch={batch}
              onComplete={(finalBatch) => {
                setBatch(finalBatch);
                setStep("report");
              }}
            />
          )}

          {step === "report" && batch && (
            <ReportStep batch={batch} onStartOver={handleStartOver} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
