"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateEnquiryStatus } from "@/features/enquiries/enquiry.actions";
import { toast } from "@/lib/toast";
import type { EnquiryStatus } from "@/features/enquiries/enquiry.types";

const STATUSES: EnquiryStatus[] = ["new", "contacted", "closed"];

export function EnquiryStatusSelect({
  enquiryId,
  status,
}: {
  enquiryId: string;
  status: EnquiryStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string | null) {
    if (!next) return;
    const nextStatus = next as EnquiryStatus;
    setValue(nextStatus);
    startTransition(async () => {
      const result = await updateEnquiryStatus(enquiryId, nextStatus);
      if (!result.success) {
        setValue(status);
        toast.error("Couldn't update status", result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" className="w-32 capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
