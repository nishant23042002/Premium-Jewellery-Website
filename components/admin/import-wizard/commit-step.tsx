"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { commitImportBatch } from "@/features/import-export/product-import/product-import.actions";
import { toast } from "@/lib/toast";
import type { ImportBatch } from "@/features/import-export/product-import/import-batch.types";

/** Rows per commitImportBatch call — mirrors the server's own MAX_ROWS_PER_COMMIT_CALL cap. */
const COMMIT_CHUNK_SIZE = 25;

interface CommitStepProps {
  batch: ImportBatch;
  onComplete: (finalBatch: ImportBatch) => void;
}

/** Drives the client-side batching loop: commits COMMIT_CHUNK_SIZE rows per call, in a loop, until the server reports nothing left pending — see product-import.actions.ts's commitImportBatch for why this is chunked rather than one call. */
export function CommitStep({ batch, onComplete }: CommitStepProps) {
  const [processed, setProcessed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const totalToCommit = useRef(
    batch.rows.filter((r) => r.status === "valid" || r.status === "warning").length,
  );
  const hasStarted = useRef(false);

  async function run() {
    setIsRunning(true);
    setError(null);

    let remaining = batch.rows
      .filter((r) => r.status === "valid" || r.status === "warning")
      .map((r) => r.rowNumber);
    let latestBatch = batch;

    try {
      while (remaining.length > 0) {
        const chunk = remaining.slice(0, COMMIT_CHUNK_SIZE);
        const result = await commitImportBatch(batch.id, chunk);
        if (!result.success) {
          setError(result.error);
          setIsRunning(false);
          return;
        }
        latestBatch = result.data.batch;
        remaining = result.data.remainingRowNumbers;
        setProcessed(totalToCommit.current - remaining.length);
      }
      onComplete(latestBatch);
    } catch {
      setError("Something went wrong partway through. You can retry — already-imported rows won't be redone.");
    } finally {
      setIsRunning(false);
    }
  }

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    run();
    // Only run once, on mount — retries are user-triggered via the button below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const percent =
    totalToCommit.current === 0 ? 100 : Math.round((processed / totalToCommit.current) * 100);

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col items-center gap-4 text-center">
        {isRunning && <Loader2 className="size-8 animate-spin text-gold" />}
        <div>
          <p className="font-medium">
            {error
              ? "Import paused"
              : isRunning
                ? "Importing your products…"
                : "Import complete"}
          </p>
          <p className="text-sm text-muted-foreground">
            {processed} of {totalToCommit.current} rows processed
            {isRunning && " — fetching images and videos takes the longest"}
          </p>
        </div>
      </div>

      <Progress value={percent} />

      {error && (
        <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={run} disabled={isRunning}>
            {isRunning && <Loader2 className="size-3.5 animate-spin" />}
            Resume Import
          </Button>
        </div>
      )}
    </div>
  );
}
