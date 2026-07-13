"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/features/orders/order.actions";
import { getNextStatuses, ORDER_STATUS_LABELS } from "@/constants/order-status";
import { toast } from "@/lib/toast";
import type { OrderStatus } from "@/features/orders/order.types";

const DESTRUCTIVE_STATUSES = new Set<OrderStatus>(["cancelled", "refunded"]);

export function OrderStatusActions({
  orderId,
  status,
  isMadeToOrder,
}: {
  orderId: string;
  status: OrderStatus;
  isMadeToOrder: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<OrderStatus | null>(null);

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

  const nextStatuses = getNextStatuses(status, isMadeToOrder);
  if (nextStatuses.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((next) => (
        <Button
          key={next}
          variant={DESTRUCTIVE_STATUSES.has(next) ? "destructive" : "gold"}
          size="sm"
          disabled={pending !== null}
          onClick={() => handleTransition(next)}
        >
          {pending === next && <Loader2 className="size-3.5 animate-spin" />}
          Mark {ORDER_STATUS_LABELS[next]}
        </Button>
      ))}
    </div>
  );
}
