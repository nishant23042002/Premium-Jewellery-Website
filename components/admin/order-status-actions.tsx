"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import { updateOrderStatus, refundOrder } from "@/features/orders/order.actions";
import { getNextStatuses, ORDER_STATUS_LABELS } from "@/constants/order-status";
import { formatINR } from "@/lib/utils/format";
import { toast } from "@/lib/toast";
import type { OrderStatus } from "@/features/orders/order.types";

const REFUND_STATUSES = new Set<OrderStatus>(["cancelled", "refunded"]);

export function OrderStatusActions({
  orderId,
  orderNumber,
  status,
  grandTotal,
  isMadeToOrder,
}: {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  grandTotal: number;
  isMadeToOrder: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const [refundTarget, setRefundTarget] = useState<OrderStatus | null>(null);

  async function handleTransition(to: OrderStatus) {
    setPending(to);
    try {
      const result = await updateOrderStatus(orderId, { status: to });
      if (!result.success) {
        toast.error("Couldn't update status", result.error);
        return;
      }
      toast.success(`Marked as ${ORDER_STATUS_LABELS[to]}`);
      router.refresh();
    } catch {
      toast.error("Couldn't update status", "Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function handleRefund() {
    if (!refundTarget) return;
    const to = refundTarget;
    setPending(to);
    try {
      const result = await refundOrder(orderId, to as "cancelled" | "refunded");
      if (!result.success) {
        toast.error("Couldn't process refund", result.error);
        return;
      }
      toast.success(`Refunded — marked as ${ORDER_STATUS_LABELS[to]}`);
      setRefundTarget(null);
      router.refresh();
    } catch {
      toast.error("Couldn't process refund", "Please try again.");
    } finally {
      setPending(null);
    }
  }

  const nextStatuses = getNextStatuses(status, isMadeToOrder);
  if (nextStatuses.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((next) => (
          <Button
            key={next}
            variant={REFUND_STATUSES.has(next) ? "destructive" : "gold"}
            size="sm"
            disabled={pending !== null}
            onClick={() =>
              REFUND_STATUSES.has(next)
                ? setRefundTarget(next)
                : handleTransition(next)
            }
          >
            {pending === next && <Loader2 className="size-3.5 animate-spin" />}
            Mark {ORDER_STATUS_LABELS[next]}
          </Button>
        ))}
      </div>

      <AlertDialog
        open={refundTarget !== null}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund {formatINR(grandTotal)}?</AlertDialogTitle>
            <AlertDialogDescription>
              This calls Razorpay&apos;s refund API for order {orderNumber} and
              sends {formatINR(grandTotal)} back to the customer&apos;s original
              payment method. This cannot be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending !== null}
              onClick={handleRefund}
            >
              {pending !== null && <Loader2 className="size-3.5 animate-spin" />}
              Refund {formatINR(grandTotal)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
