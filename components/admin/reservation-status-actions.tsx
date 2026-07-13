"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateReservationStatus } from "@/features/reservations/reservation.actions";
import { toast } from "@/lib/toast";
import type { ReservationStatus } from "@/features/reservations/reservation.types";

const TRANSITIONS: Record<
  ReservationStatus,
  {
    to: ReservationStatus;
    label: string;
    variant: "gold" | "outline" | "destructive";
  }[]
> = {
  pending: [
    { to: "confirmed", label: "Confirm", variant: "gold" },
    { to: "cancelled", label: "Cancel", variant: "destructive" },
  ],
  confirmed: [
    { to: "completed", label: "Mark Completed", variant: "gold" },
    { to: "cancelled", label: "Cancel", variant: "destructive" },
  ],
  completed: [],
  cancelled: [{ to: "pending", label: "Reopen", variant: "outline" }],
};

export function ReservationStatusActions({
  reservationId,
  status,
}: {
  reservationId: string;
  status: ReservationStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<ReservationStatus | null>(null);

  async function handleTransition(to: ReservationStatus) {
    setPending(to);
    try {
      const result = await updateReservationStatus(reservationId, {
        status: to,
      });
      if (!result.success) {
        toast.error("Couldn't update status", result.error);
        return;
      }
      toast.success(`Marked as ${to}`);
      router.refresh();
    } catch {
      toast.error("Couldn't update status", "Please try again.");
    } finally {
      setPending(null);
    }
  }

  const options = TRANSITIONS[status];
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.to}
          variant={option.variant}
          size="sm"
          disabled={pending !== null}
          onClick={() => handleTransition(option.to)}
        >
          {pending === option.to && (
            <Loader2 className="size-3.5 animate-spin" />
          )}
          {option.label}
        </Button>
      ))}
    </div>
  );
}
