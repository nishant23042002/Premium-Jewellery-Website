"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormActionsBarProps {
  isSubmitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  cancelLabel?: string;
  /** Small "Draft saved" hint — pass the autosave hook's last-saved timestamp. */
  draftSavedAt?: Date | null;
}

/** Sticky bottom action row for admin forms — stays reachable on long forms instead of scrolling away. */
export function FormActionsBar({
  isSubmitting,
  submitLabel,
  onCancel,
  cancelLabel = "Cancel",
  draftSavedAt,
}: FormActionsBarProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <Button type="submit" variant="gold" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
      {draftSavedAt && (
        <p className="ml-auto text-xs text-muted-foreground">
          Draft saved{" "}
          {draftSavedAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
