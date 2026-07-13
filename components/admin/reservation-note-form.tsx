"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addReservationNote } from "@/features/reservations/reservation.actions";
import { toast } from "@/lib/toast";

export function ReservationNoteForm({
  reservationId,
}: {
  reservationId: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await addReservationNote(reservationId, note);
      if (!result.success) {
        toast.error("Couldn't add note", result.error);
        return;
      }
      setNote("");
      router.refresh();
    } catch {
      toast.error("Couldn't add note", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add an internal note..."
        rows={2}
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        variant="outline"
        disabled={isSubmitting || !note.trim()}
      >
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </form>
  );
}
