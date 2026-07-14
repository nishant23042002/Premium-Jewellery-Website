"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { requireCustomer } from "@/lib/auth/customer-session";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { logger } from "@/lib/logger";
import { OrderModel } from "@/features/orders/order.model";
import {
  updateOrderStatusSchema,
  updateTrackingSchema,
  type UpdateOrderStatusInput,
  type UpdateTrackingInput,
} from "@/features/orders/order.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type {
  AddressSnapshot,
  Order,
  OrderItem,
  OrderStatus,
} from "@/features/orders/order.types";

interface OrderItemDoc extends Omit<OrderItem, "productId"> {
  productId: unknown;
}

interface OrderDoc {
  _id: unknown;
  tenantId: string;
  orderNumber: string;
  customerId: unknown;
  customerSnapshot: Order["customerSnapshot"];
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  items: OrderItemDoc[];
  pricing: Order["pricing"];
  couponCode?: string | null;
  payment: Order["payment"];
  status: Order["status"];
  statusHistory: Order["statusHistory"];
  trackingNumber?: string | null;
  courier?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toOrder(doc: OrderDoc): Order {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    orderNumber: doc.orderNumber,
    customerId: String(doc.customerId),
    customerSnapshot: doc.customerSnapshot,
    shippingAddress: doc.shippingAddress,
    billingAddress: doc.billingAddress,
    items: doc.items.map((item) => ({
      ...item,
      productId: String(item.productId),
    })),
    pricing: doc.pricing,
    couponCode: doc.couponCode ?? undefined,
    payment: doc.payment,
    status: doc.status,
    statusHistory: doc.statusHistory,
    trackingNumber: doc.trackingNumber ?? undefined,
    courier: doc.courier ?? undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** `AJ-2026-00042` — year plus a per-year sequence, human-readable and sortable. Not exposed as a public action; only called from the payment-verify route inside a transaction. */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await OrderModel.countDocuments({
    tenantId: DEFAULT_TENANT_ID,
    orderNumber: { $regex: `^AJ-${year}-` },
  });
  return `AJ-${year}-${String(count + 1).padStart(5, "0")}`;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const session = await requireCustomer();
  await connectToDatabase();
  const doc = await OrderModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
    customerId: session.sub,
  }).lean();
  return doc ? toOrder(doc as unknown as OrderDoc) : null;
}

export async function listOrdersForCustomer(): Promise<Order[]> {
  const session = await requireCustomer();
  await connectToDatabase();
  const docs = await OrderModel.find({
    tenantId: DEFAULT_TENANT_ID,
    customerId: session.sub,
  })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => toOrder(doc as unknown as OrderDoc));
}

export async function listOrdersForAdmin(): Promise<Order[]> {
  await requireAdmin();
  await connectToDatabase();
  const docs = await OrderModel.find({ tenantId: DEFAULT_TENANT_ID })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => toOrder(doc as unknown as OrderDoc));
}

export async function getOrderByIdForAdmin(id: string): Promise<Order | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await OrderModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toOrder(doc as unknown as OrderDoc) : null;
}

export async function updateOrderStatus(
  id: string,
  values: UpdateOrderStatusInput,
): Promise<ActionResult<Order>> {
  const session = await requirePermission("orders.manage");

  const parsed = updateOrderStatusSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid status update",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await OrderModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    {
      $set: { status: parsed.data.status },
      $push: {
        statusHistory: {
          status: parsed.data.status,
          note: parsed.data.note,
          byAdminName: session.email,
          at: new Date(),
        },
      },
    },
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Order not found" };
  }

  logAudit(
    session,
    "status_changed",
    "order",
    String(doc._id),
    doc.orderNumber,
    {
      status: parsed.data.status,
    },
  );
  revalidatePath(ROUTES.admin.orders);
  revalidatePath(ROUTES.admin.order(id));
  return {
    success: true,
    data: toOrder(doc.toObject() as unknown as OrderDoc),
  };
}

/**
 * The only path that actually moves money back to a customer — previously
 * "Mark Refunded" just flipped `status` to "refunded" in MongoDB with no
 * Razorpay call at all, so the order looked refunded while the customer's
 * money never moved. Called for both "cancelled" and "refunded" target
 * statuses (see order-status-actions.tsx) since every Order in this system
 * only ever exists once payment succeeded — there's no "cancel before
 * paying" state, so cancelling a paid order owes the customer their money
 * back exactly the same as an explicit refund does.
 */
export async function refundOrder(
  id: string,
  targetStatus: Extract<OrderStatus, "cancelled" | "refunded">,
  note?: string,
): Promise<ActionResult<Order>> {
  const session = await requirePermission("orders.manage");

  await connectToDatabase();

  const existing = await OrderModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  });
  if (!existing) {
    return { success: false, error: "Order not found" };
  }
  if (existing.payment.status !== "paid") {
    return {
      success: false,
      error: `This order's payment is "${existing.payment.status}", not "paid" — nothing to refund.`,
    };
  }
  if (!existing.payment.razorpayPaymentId) {
    return {
      success: false,
      error: "This order has no linked Razorpay payment to refund.",
    };
  }

  let refund;
  try {
    const razorpay = getRazorpayClient();
    refund = await razorpay.payments.refund(existing.payment.razorpayPaymentId, {
      speed: "normal",
      notes: { orderId: id, orderNumber: existing.orderNumber },
    });
  } catch (error) {
    const description =
      error && typeof error === "object" && "error" in error
        ? (error as { error?: { description?: string } }).error?.description
        : undefined;
    logger.error("refundOrder", "Razorpay refund failed", {
      error,
      orderId: id,
      razorpayPaymentId: existing.payment.razorpayPaymentId,
    });
    return {
      success: false,
      error: description ?? "Refund failed. Please try again or check the Razorpay dashboard.",
    };
  }

  const doc = await OrderModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    {
      $set: {
        status: targetStatus,
        "payment.status": "refunded",
        "payment.refundId": refund.id,
        "payment.refundedAt": new Date(),
      },
      $push: {
        statusHistory: {
          status: targetStatus,
          note: note
            ? `Refunded via Razorpay (${refund.id}) — ${note}`
            : `Refunded via Razorpay (${refund.id})`,
          byAdminName: session.email,
          at: new Date(),
        },
      },
    },
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Order not found" };
  }

  logAudit(session, "refunded", "order", String(doc._id), doc.orderNumber, {
    status: targetStatus,
    razorpayRefundId: refund.id,
  });
  revalidatePath(ROUTES.admin.orders);
  revalidatePath(ROUTES.admin.order(id));

  return {
    success: true,
    data: toOrder(doc.toObject() as unknown as OrderDoc),
  };
}

export async function updateTrackingInfo(
  id: string,
  values: UpdateTrackingInput,
): Promise<ActionResult<Order>> {
  const session = await requirePermission("orders.manage");

  const parsed = updateTrackingSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid tracking info",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await OrderModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { $set: parsed.data },
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Order not found" };
  }

  logAudit(
    session,
    "tracking_updated",
    "order",
    String(doc._id),
    doc.orderNumber,
  );
  revalidatePath(ROUTES.admin.order(id));
  return {
    success: true,
    data: toOrder(doc.toObject() as unknown as OrderDoc),
  };
}
