"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { CustomerModel } from "@/features/customers/customer.model";
import { ReservationModel } from "@/features/reservations/reservation.model";
import { EnquiryModel } from "@/features/enquiries/enquiry.model";
import {
  customerNotesFormSchema,
  type CustomerNotesFormInput,
} from "@/features/customers/customer.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult, PaginatedResult } from "@/types/common";
import type {
  Customer,
  CustomerEnquirySummary,
  CustomerReservationSummary,
} from "@/features/customers/customer.types";

interface CustomerDoc {
  _id: unknown;
  tenantId: string;
  name: string;
  phone: string;
  email?: string | null;
  tags: string[];
  notes?: string | null;
  totalReservations: number;
  totalEnquiries: number;
  lastContactAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function toCustomer(doc: CustomerDoc): Customer {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    name: doc.name,
    phone: doc.phone,
    email: doc.email ?? undefined,
    tags: doc.tags,
    notes: doc.notes ?? undefined,
    totalReservations: doc.totalReservations,
    totalEnquiries: doc.totalEnquiries,
    lastContactAt: doc.lastContactAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Upserts a lightweight customer record keyed by phone number — called from
 * the public Reservation and Enquiry submit actions. There are no customer
 * accounts in v1 (PRD), so this is the only place customer data originates;
 * it's additive bookkeeping, never a blocker for the reservation/enquiry
 * itself if something here were to fail.
 */
export async function upsertCustomerFromContact({
  name,
  phone,
  email,
  source,
}: {
  name: string;
  phone: string;
  email?: string;
  source: "reservation" | "enquiry";
}): Promise<void> {
  await connectToDatabase();

  await CustomerModel.findOneAndUpdate(
    { tenantId: DEFAULT_TENANT_ID, phone },
    {
      $set: {
        name,
        ...(email ? { email } : {}),
        lastContactAt: new Date(),
      },
      $setOnInsert: { tenantId: DEFAULT_TENANT_ID, phone, tags: [] },
      $inc:
        source === "reservation"
          ? { totalReservations: 1 }
          : { totalEnquiries: 1 },
    },
    { upsert: true },
  );
}

export interface ListCustomersParams {
  query?: string;
  page?: number;
  pageSize?: number;
}

export async function listCustomers({
  query,
  page = 1,
  pageSize = 20,
}: ListCustomersParams = {}): Promise<PaginatedResult<Customer>> {
  await requireAdmin();
  await connectToDatabase();

  const filter: Record<string, unknown> = { tenantId: DEFAULT_TENANT_ID };
  if (query?.trim()) {
    const safe = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(safe, "i");
    filter.$or = [{ name: pattern }, { phone: pattern }, { email: pattern }];
  }

  const [docs, total] = await Promise.all([
    CustomerModel.find(filter)
      .sort({ lastContactAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    CustomerModel.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => toCustomer(doc as unknown as CustomerDoc)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCustomerById(id: string): Promise<{
  customer: Customer;
  reservations: CustomerReservationSummary[];
  enquiries: CustomerEnquirySummary[];
} | null> {
  await requireAdmin();
  await connectToDatabase();

  const doc = await CustomerModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  if (!doc) return null;

  const customer = toCustomer(doc as unknown as CustomerDoc);

  const [reservationDocs, enquiryDocs] = await Promise.all([
    ReservationModel.find({
      tenantId: DEFAULT_TENANT_ID,
      phone: customer.phone,
    })
      .sort({ createdAt: -1 })
      .lean(),
    EnquiryModel.find({ tenantId: DEFAULT_TENANT_ID, phone: customer.phone })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    customer,
    reservations: reservationDocs.map((r) => ({
      id: String(r._id),
      status: r.status,
      preferredDate: r.preferredDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
    enquiries: enquiryDocs.map((e) => ({
      id: String(e._id),
      status: e.status,
      message: e.message ?? undefined,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export async function updateCustomerNotes(
  id: string,
  values: CustomerNotesFormInput,
): Promise<ActionResult> {
  const session = await requirePermission("customers.manage");

  const parsed = customerNotesFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  await connectToDatabase();

  const doc = await CustomerModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
  );
  if (!doc) {
    return { success: false, error: "Customer not found" };
  }

  logAudit(session, "updated", "customer", id, doc.name);
  revalidatePath(ROUTES.admin.customer(id));
  return { success: true, data: undefined };
}
