import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

/**
 * Notifications-style side collection carrying the whole lifecycle of a
 * bulk product import — preview state, per-row validation results, commit
 * progress, and everything "Undo Last Import" needs (`beforeSnapshot` on
 * updated rows; created rows are undone via the existing soft-delete
 * `deletedAt` convention on Product itself, not stored here).
 */
const importBatchRowSchema = new Schema(
  {
    rowNumber: { type: Number, required: true },
    sourceData: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "valid", "warning", "error", "skipped", "committed"],
      required: true,
      default: "pending",
    },
    errors: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    // What this row will do if committed — resolved during preview,
    // editable by the admin before commit (e.g. force "skip").
    plannedAction: {
      type: String,
      enum: ["create", "update", "skip"],
    },
    matchedProductId: { type: String },
    matchType: { type: String, enum: ["sku", "slug", "barcode"] },
    // The fully-resolved, schema-validated payload ready for
    // createProduct/updateProduct once media ingestion (Phase 3) fills in
    // `images`/`videos` from `imageUrls`/`videoUrls`.
    normalizedData: { type: Schema.Types.Mixed },
    resultAction: { type: String, enum: ["created", "updated", "skipped"] },
    resultProductId: { type: String },
    // Full prior Product doc — only set when resultAction === "updated".
    // What "Undo Last Import" restores.
    beforeSnapshot: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const importBatchSchema = new Schema(
  {
    tenantId: tenantField,
    adminId: { type: String, required: true },
    adminEmail: { type: String, required: true },
    fileName: { type: String, required: true },
    originalRowCount: { type: Number, required: true },
    // "update" mode never creates products and treats an unmapped column as
    // "leave this field alone" rather than "reset to default" — see
    // parseAndValidateImport's mode-aware candidate building.
    mode: { type: String, enum: ["full", "update"], required: true, default: "full" },
    // Saved so a corrected re-upload of the same file doesn't need
    // remapping — keyed by internal field name, valued by the CSV column
    // header it was resolved to.
    fieldMapping: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["previewing", "committing", "completed", "failed", "undone"],
      required: true,
      default: "previewing",
    },
    rows: { type: [importBatchRowSchema], default: [] },
    counts: {
      type: new Schema(
        {
          created: { type: Number, default: 0 },
          updated: { type: Number, default: 0 },
          skipped: { type: Number, default: 0 },
          failed: { type: Number, default: 0 },
          mediaUploaded: { type: Number, default: 0 },
          mediaFailed: { type: Number, default: 0 },
        },
        { _id: false },
      ),
      default: () => ({
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        mediaUploaded: 0,
        mediaFailed: 0,
      }),
    },
    completedAt: { type: Date },
    undoneAt: { type: Date },
  },
  { timestamps: true },
);

importBatchSchema.index({ tenantId: 1, createdAt: -1 });

export type ImportBatchDocument = InferSchemaType<typeof importBatchSchema>;

export const ImportBatchModel: Model<ImportBatchDocument> =
  models.ImportBatch ??
  model<ImportBatchDocument>("ImportBatch", importBatchSchema);
