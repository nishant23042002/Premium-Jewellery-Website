"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateReservationStatus } from "@/features/reservations/reservation.actions";
import { toast } from "@/lib/toast";
import {
  buildWhatsAppLink,
  reservationStatusCustomerMessage,
} from "@/lib/notifications/whatsapp-templates";
import {
  RESERVATION_STATUS_TRANSITIONS,
  type Reservation,
  type ReservationStatus,
} from "@/features/reservations/reservation.types";

/** Label + button styling per possible target status — the *set* of legal transitions itself comes from RESERVATION_STATUS_TRANSITIONS (shared with the email-action route handler) so the two can never disagree about what's allowed. */
const TRANSITION_META: Record<
  ReservationStatus,
  { label: string; variant: "gold" | "outline" | "destructive" }
> = {
  pending: { label: "Reopen", variant: "outline" },
  confirmed: { label: "Confirm", variant: "gold" },
  completed: { label: "Mark Completed", variant: "gold" },
  cancelled: { label: "Cancel", variant: "destructive" },
};

export function ReservationStatusActions({
  reservation,
}: {
  reservation: Reservation;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<ReservationStatus | null>(null);
  const [whatsappPrompt, setWhatsappPrompt] = useState<{
    label: string;
    url: string;
  } | null>(null);

  async function handleTransition(to: ReservationStatus) {
    setPending(to);
    setWhatsappPrompt(null);
    try {
      const result = await updateReservationStatus(reservation.id, {
        status: to,
      });
      if (!result.success) {
        toast.error("Couldn't update status", result.error);
        return;
      }
      toast.success(`Marked as ${to}`);

      const message = reservationStatusCustomerMessage(result.data, to);
      if (message && result.data.phone) {
        setWhatsappPrompt({
          label: TRANSITION_META[to].label,
          url: buildWhatsAppLink(result.data.phone, message),
        });
      }

      router.refresh();
    } catch {
      toast.error("Couldn't update status", "Please try again.");
    } finally {
      setPending(null);
    }
  }

  const targets = RESERVATION_STATUS_TRANSITIONS[reservation.status];

  return (
    <div className="space-y-3">
      {targets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {targets.map((to) => {
            const meta = TRANSITION_META[to];
            return (
              <Button
                key={to}
                variant={meta.variant}
                size="sm"
                disabled={pending !== null}
                onClick={() => handleTransition(to)}
              >
                {pending === to && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {meta.label}
              </Button>
            );
          })}
        </div>
      )}

      {whatsappPrompt && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2">
          <p className="flex-1 text-xs text-muted-foreground">
            Let {reservation.name} know their reservation is now{" "}
            {whatsappPrompt.label.toLowerCase()}.
          </p>
          <Button
            variant="outline-gold"
            size="sm"
            nativeButton={false}
            render={
              <a
                href={whatsappPrompt.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-3.5" />
                Send WhatsApp Update
              </a>
            }
          />
        </div>
      )}
    </div>
  );
}
