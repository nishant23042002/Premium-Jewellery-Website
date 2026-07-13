"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import type { ActionResult } from "@/types/common";

interface PublishToggleProps {
  checked: boolean;
  onToggle: (next: boolean) => Promise<ActionResult<unknown>>;
}

/** Instant-save publish/active switch used in list tables — no separate "Save" step. */
export function PublishToggle({ checked, onToggle }: PublishToggleProps) {
  const [value, setValue] = useState(checked);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setValue(next);
    startTransition(async () => {
      const result = await onToggle(next);
      if (!result.success) {
        setValue(!next);
        toast.error("Couldn't update", result.error);
      }
    });
  }

  return (
    <Switch
      checked={value}
      onCheckedChange={handleChange}
      disabled={isPending}
    />
  );
}
