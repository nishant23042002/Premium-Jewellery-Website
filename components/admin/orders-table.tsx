"use client";

import Image from "next/image";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/constants/order-status";
import { formatDate, formatINR } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import { isMadeToOrderOrder, type Order } from "@/features/orders/order.types";

const TERMINAL_BADGE_VARIANT: Record<
  string,
  "success" | "outline" | "secondary" | "destructive"
> = {
  delivered: "success",
  cancelled: "destructive",
  refunded: "destructive",
};

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <Link
        href={ROUTES.admin.order(row.original.id)}
        className="font-medium hover:text-gold-dark"
      >
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    id: "product",
    header: "Product",
    cell: ({ row }) => {
      const firstItem = row.original.items[0];
      const extraCount = row.original.items.length - 1;
      if (!firstItem) return null;
      return (
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
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
          <span className="max-w-40 truncate text-sm">
            {firstItem.name}
            {extraCount > 0 && (
              <span className="text-muted-foreground"> +{extraCount}</span>
            )}
          </span>
        </div>
      );
    },
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => row.original.customerSnapshot.name,
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) =>
      isMadeToOrderOrder(row.original) ? (
        <Badge variant="outline">Made to Order</Badge>
      ) : (
        <Badge variant="secondary">Ready Stock</Badge>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={TERMINAL_BADGE_VARIANT[row.original.status] ?? "outline"}>
        {ORDER_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    id: "total",
    header: "Total",
    cell: ({ row }) => formatINR(row.original.pricing.grandTotal),
  },
  {
    id: "createdAt",
    header: "Placed",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

export function OrdersTable({ data }: { data: Order[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="orderNumber"
      searchPlaceholder="Search by order number..."
    />
  );
}
