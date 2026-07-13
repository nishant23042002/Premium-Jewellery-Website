import { Schema } from "mongoose";
import type { LocalizedText } from "@/types/common";

/** Reusable {en, hi, mr} subdocument schema shared by every localized field. */
export function localizedTextSchema(required = false) {
  return new Schema<LocalizedText>(
    {
      en: { type: String, required, trim: true, default: "" },
      hi: { type: String, required, trim: true, default: "" },
      mr: { type: String, required, trim: true, default: "" },
    },
    { _id: false },
  );
}

/**
 * Single-tenant today, but every model carries `tenantId` from day one so
 * scaling to the multi-tenant SaaS phase (PRD §45) is a data-partitioning
 * change, not a schema migration.
 */
export const DEFAULT_TENANT_ID = "shree-ambika-jewellers";

export const tenantField = {
  type: String,
  required: true,
  default: DEFAULT_TENANT_ID,
  index: true,
} as const;

/**
 * Soft-delete convention (Phase 7 "Recycle Bin") — every content model that
 * should be recoverable after deletion carries this instead of being
 * removed with `deleteOne()`. `null` means "not deleted"; list queries
 * should merge `NOT_DELETED_FILTER` into their filter, and a delete action
 * should set `deletedAt: new Date()` rather than actually removing the doc.
 */
export const deletedAtField = {
  type: Date,
  default: null,
} as const;

export const NOT_DELETED_FILTER = { deletedAt: null } as const;
