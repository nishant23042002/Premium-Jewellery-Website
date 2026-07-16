"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IMPORT_FIELD_LABELS,
  REQUIRED_INTERNAL_FIELDS,
} from "@/features/import-export/product-import/column-mapping";
import type { ImportMappingRequired } from "@/features/import-export/product-import/import-batch.types";

const REQUIRED_SET = new Set<string>(REQUIRED_INTERNAL_FIELDS);
const NONE_VALUE = "__none__";

interface MappingStepProps {
  mapping: ImportMappingRequired;
  onSubmit: (mappingOverride: Record<string, string>) => void;
  isLoading: boolean;
}

/** Shown when auto-detection can't confidently cover every required field — lets the admin manually pair each internal field with one of the file's actual column headers. */
export function MappingStep({ mapping, onSubmit, isLoading }: MappingStepProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>(
    mapping.suggestedMapping,
  );

  const allFields = Object.keys(IMPORT_FIELD_LABELS);
  const missing = new Set(mapping.missingRequiredFields);

  // Base UI's Select.Value only resolves a label from an `items` map (or
  // from the matching SelectItem already being mounted in the DOM) — without
  // it, the trigger shows the raw value ("__none__") until the popup has
  // been opened once. Passing `items` explicitly avoids that.
  const selectItems: Record<string, string> = { [NONE_VALUE]: "Not in file" };
  for (const header of mapping.headers) {
    selectItems[header] = header;
  }

  function handleSubmit() {
    const cleaned = Object.fromEntries(
      Object.entries(assignments).filter(([, column]) => column && column !== NONE_VALUE),
    );
    onSubmit(cleaned);
  }

  const stillMissingRequired = REQUIRED_INTERNAL_FIELDS.filter(
    (field) => !assignments[field] || assignments[field] === NONE_VALUE,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t confidently match every required column to your
        headers ({[...missing].map((f) => IMPORT_FIELD_LABELS[f] ?? f).join(", ")}).
        Pick which column in your file corresponds to each field below.
      </p>

      <div className="max-h-[28rem] space-y-2 overflow-y-auto rounded-lg border border-border p-3" data-lenis-prevent>
        {allFields.map((field) => {
          const isRequired = REQUIRED_SET.has(field);
          return (
            <div
              key={field}
              className="grid grid-cols-2 items-center gap-3 rounded-md px-2 py-1.5 text-sm even:bg-secondary/20"
            >
              <span>
                {IMPORT_FIELD_LABELS[field]}
                {isRequired && <span className="ml-1 text-destructive">*</span>}
              </span>
              <Select
                items={selectItems}
                value={assignments[field] || NONE_VALUE}
                onValueChange={(value) =>
                  setAssignments((prev) => ({ ...prev, [field]: value ?? NONE_VALUE }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Not in file" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Not in file</SelectItem>
                  {mapping.headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        {stillMissingRequired.length > 0 ? (
          <p className="text-xs text-destructive">
            Still need: {stillMissingRequired.map((f) => IMPORT_FIELD_LABELS[f]).join(", ")}
          </p>
        ) : (
          <span />
        )}
        <Button
          variant="gold"
          onClick={handleSubmit}
          disabled={isLoading || stillMissingRequired.length > 0}
        >
          {isLoading && <Loader2 className="size-3.5 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}
