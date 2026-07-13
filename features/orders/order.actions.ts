"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { requireCustomer } from "@/lib/auth/customer-session";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
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
