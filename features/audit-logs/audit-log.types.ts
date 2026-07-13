/** A single recorded admin action — powers the Audit Logs screen (Phase 7 "System"). */
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  resourceLabel?: string;
  metadata?: Record<string, unknown>;
  at: string;
}
