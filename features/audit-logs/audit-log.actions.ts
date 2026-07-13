"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { AuditLogModel } from "@/features/audit-logs/audit-log.model";
import type { PaginatedResult } from "@/types/common";
import type { AuditLogEntry } from "@/features/audit-logs/audit-log.types";
import type { SessionPayload } from "@/features/auth/admin-user.types";

interface AuditLogDoc {
  _id: unknown;
  tenantId: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  resourceLabel?: string | null;
  metadata?: Record<string, unknown> | null;
  at: Date;
}

function toEntry(doc: AuditLogDoc): AuditLogEntry {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    actorId: doc.actorId,
    actorEmail: doc.actorEmail,
    action: doc.action,
    resource: doc.resource,
    resourceId: doc.resourceId ?? undefined,
    resourceLabel: doc.resourceLabel ?? undefined,
    metadata: doc.metadata ?? undefined,
    at: doc.at.toISOString(),
  };
}

/**
 * Fire-and-forget audit trail called from mutating Server Actions across the
 * admin panel (PRD §43 — business-critical traceability distinct from
 * general app logs). Deliberately swallows its own errors: a logging
 * failure must never roll back or fail the mutation that already succeeded.
 */
export async function logAudit(
  session: SessionPayload,
  action: string,
  resource: string,
  resourceId?: string,
  resourceLabel?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLogModel.create({
      tenantId: session.tenantId,
      actorId: session.sub,
      actorEmail: session.email,
      action,
      resource,
      resourceId,
      resourceLabel,
      metadata,
      at: new Date(),
    });
  } catch (error) {
    logger.error("logAudit", "failed to write audit log entry", {
      error,
      action,
      resource,
    });
  }
}

export interface ListAuditLogsParams {
  resource?: string;
  page?: number;
  pageSize?: number;
}

export async function listAuditLogs({
  resource,
  page = 1,
  pageSize = 50,
}: ListAuditLogsParams = {}): Promise<PaginatedResult<AuditLogEntry>> {
  await requirePermission("audit.view");
  await connectToDatabase();

  const filter: Record<string, unknown> = { tenantId: DEFAULT_TENANT_ID };
  if (resource) filter.resource = resource;

  const [docs, total] = await Promise.all([
    AuditLogModel.find(filter)
      .sort({ at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AuditLogModel.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => toEntry(doc as unknown as AuditLogDoc)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Distinct resource names seen so far — powers the Audit Logs filter dropdown. */
export async function listAuditResources(): Promise<string[]> {
  await requirePermission("audit.view");
  await connectToDatabase();
  const resources = await AuditLogModel.distinct("resource", {
    tenantId: DEFAULT_TENANT_ID,
  });
  return (resources as string[]).sort();
}
