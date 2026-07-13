"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongoose";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { EnquiryModel } from "@/features/enquiries/enquiry.model";
import {
  enquiryFormSchema,
  type EnquiryFormValues,
} from "@/features/enquiries/enquiry.schema";
import { upsertCustomerFromContact } from "@/features/customers/customer.actions";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type {
  Enquiry,
  EnquiryStatus,
} from "@/features/enquiries/enquiry.types";

function toEnquiry(doc: {
  _id: unknown;
  tenantId: string;
  productId?: unknown;
  name: string;
  phone: string;
  message?: string | null;
  source: Enquiry["source"];
  status: Enquiry["status"];
  createdAt: Date;
}): Enquiry {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    productId: doc.productId ? String(doc.productId) : null,
    name: doc.name,
    phone: doc.phone,
    message: doc.message ?? undefined,
    source: doc.source,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}

/** Public — called from the contact form and the WhatsApp/call CTA fallback. Rate-limited here directly (this is the actual storefront path — the /api/enquiries route is a separate, also-limited entry point for non-Next clients). */
export async function createEnquiry(
  values: EnquiryFormValues,
): Promise<ActionResult<Enquiry>> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for") ??
    headerList.get("x-real-ip") ??
    "unknown";
  const rateLimit = checkRateLimit(`enquiry-action:${ip}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Too many requests. Please try again in a minute.",
    };
  }

  const parsed = enquiryFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid enquiry data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await EnquiryModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  upsertCustomerFromContact({
    name: parsed.data.name,
    phone: parsed.data.phone,
    source: "enquiry",
  }).catch((error) =>
    logger.error("upsertCustomerFromContact", "failed", { error }),
  );

  revalidatePath("/admin/enquiries");
  return { success: true, data: toEnquiry(doc.toObject()) };
}

export async function listEnquiries(
  status?: EnquiryStatus,
): Promise<Enquiry[]> {
  await requireAdmin();
  await connectToDatabase();

  const filter: Record<string, unknown> = { tenantId: DEFAULT_TENANT_ID };
  if (status) filter.status = status;

  const docs = await EnquiryModel.find(filter).sort({ createdAt: -1 }).lean();
  return docs.map(toEnquiry);
}

export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
): Promise<ActionResult> {
  const session = await requirePermission("enquiries.manage");
  await connectToDatabase();

  const doc = await EnquiryModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { status },
  );

  if (!doc) {
    return { success: false, error: "Enquiry not found" };
  }

  logAudit(session, "status_changed", "enquiry", id, doc.name, { status });
  revalidatePath(ROUTES.admin.enquiries);
  return { success: true, data: undefined };
}
