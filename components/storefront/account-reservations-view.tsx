"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarClock, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReservationForm } from "@/components/storefront/reservation-form";
import {
  cancelReservationAsCustomer,
} from "@/features/reservations/reservation.actions";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { RESERVATION_STATUS_META } from "@/constants/reservation";
import { formatDate } from "@/lib/utils/format";
import { toast } from "@/lib/toast";
import type { Reservation } from "@/features/reservations/reservation.types";

interface AccountReservationsViewProps {
  reservations: Reservation[];
  prefillCustomer: { name: string; phone?: string; email: string };
}

/** Statuses a customer can still cancel from themselves — mirrors RESERVATION_STATUS_TRANSITIONS server-side (cancelReservationAsCustomer re-validates, this is just for which button to show). */
const CANCELLABLE_STATUSES = new Set(["pending", "confirmed"]);

export function AccountReservationsView({
  reservations,
  prefillCustomer,
}: AccountReservationsViewProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(reservations.length === 0);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [isPending, startTransition] = useTransition();

  // Picks up admin-side status changes (confirmed/completed/cancelled)
  // without the customer needing to reload this page.
  useAutoRefresh(15_000);

  function handleFormSuccess() {
    setShowForm(false);
    router.refresh();
  }

  function handleCancel() {
    if (!cancelTarget) return;
    const id = cancelTarget.id;
    startTransition(async () => {
      const result = await cancelReservationAsCustomer(id);
      if (!result.success) {
        toast.error("Couldn't cancel that", result.error);
        return;
      }
      toast.success("Reservation cancelled");
      setCancelTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {reservations.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant={showForm ? "outline" : "gold"}
            size="sm"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? (
              <>
                <X className="size-3.5" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                Book a New Visit
              </>
            )}
          </Button>
        </div>
      )}

      {showForm && (
        <Card className="border-border/60">
          <CardContent className="pt-2">
            <h2 className="mb-4 font-heading text-xl">Reserve Your Visit</h2>
            <ReservationForm
              prefillCustomer={prefillCustomer}
              onSuccess={handleFormSuccess}
            />
          </CardContent>
        </Card>
      )}

      {reservations.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <CalendarClock
            className="mx-auto mb-4 size-8 text-muted-foreground"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted-foreground">
            You haven&apos;t booked a visit yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => {
            const firstItem = reservation.products[0];
            const extraCount = reservation.products.length - 1;
            const statusMeta = RESERVATION_STATUS_META[reservation.status];
            const canCancel = CANCELLABLE_STATUSES.has(reservation.status);
            return (
              <Card key={reservation.id} className="border-border/60">
                <CardContent className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    {firstItem && (
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {firstItem.imageUrl && (
                          <Image
                            src={firstItem.imageUrl}
                            alt={firstItem.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {firstItem?.name ?? "Showroom visit"}
                        {extraCount > 0 && (
                          <span className="text-muted-foreground">
                            {" "}
                            +{extraCount} more
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(reservation.preferredDate)} ·{" "}
                        {reservation.preferredTimeSlot}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                    <Badge variant={statusMeta.badgeVariant}>
                      {statusMeta.label}
                    </Badge>
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelTarget(reservation)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget && (
                <>
                  Your visit on {formatDate(cancelTarget.preferredDate)} (
                  {cancelTarget.preferredTimeSlot}) will be cancelled. You can
                  always book another visit later.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={handleCancel}
            >
              {isPending ? "Cancelling..." : "Cancel Reservation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
