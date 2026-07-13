import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const auditLogSchema = new Schema(
  {
    tenantId: tenantField,
    actorId: { type: String, required: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    resourceLabel: { type: String },
    metadata: { type: Schema.Types.Mixed },
    at: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false },
);

auditLogSchema.index({ tenantId: 1, at: -1 });
auditLogSchema.index({ tenantId: 1, resource: 1, at: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;

export const AuditLogModel: Model<AuditLogDocument> =
  models.AuditLog ?? model<AuditLogDocument>("AuditLog", auditLogSchema);
