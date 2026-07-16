export type ImportRowStatus =
  | "pending"
  | "valid"
  | "warning"
  | "error"
  | "skipped"
  | "committed";

export type ImportPlannedAction = "create" | "update" | "skip";
export type ImportResultAction = "created" | "updated" | "skipped";
export type ImportMatchType = "sku" | "slug" | "barcode";
export type ImportBatchStatus =
  | "previewing"
  | "committing"
  | "completed"
  | "failed"
  | "undone";

/**
 * "full" behaves exactly as every prior phase built it — every row is a
 * complete product record, missing required fields are validation errors.
 * "update" is for a CSV covering only the columns you want to change (e.g.
 * just skuCode + quantity for a price/stock refresh): it never creates a
 * product, and any field not present in the file is left exactly as it
 * already is on the matched product rather than reset to a schema default.
 */
export type ImportMode = "full" | "update";

export interface ImportBatchRow {
  rowNumber: number;
  sourceData: Record<string, string>;
  status: ImportRowStatus;
  errors: string[];
  warnings: string[];
  plannedAction?: ImportPlannedAction;
  matchedProductId?: string;
  matchType?: ImportMatchType;
  /** Schema-validated payload, ready for createProduct/updateProduct once media ingestion fills in images/videos. */
  normalizedData?: NormalizedImportRow;
  resultAction?: ImportResultAction;
  resultProductId?: string;
  beforeSnapshot?: unknown;
}

export interface ImportBatchCounts {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  mediaUploaded: number;
  mediaFailed: number;
}

export interface ImportBatch {
  id: string;
  tenantId: string;
  adminId: string;
  adminEmail: string;
  fileName: string;
  originalRowCount: number;
  mode: ImportMode;
  fieldMapping: Record<string, string>;
  status: ImportBatchStatus;
  rows: ImportBatchRow[];
  counts: ImportBatchCounts;
  completedAt?: string;
  undoneAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight projection for the Import History list — omits `rows`, which can be large. */
export interface ImportBatchSummary {
  id: string;
  fileName: string;
  adminEmail: string;
  status: ImportBatchStatus;
  counts: ImportBatchCounts;
  rowCount: number;
  completedAt?: string;
  undoneAt?: string;
  createdAt: string;
}

/**
 * The internal, format-agnostic shape a parsed CSV row is normalized into
 * before validation — deliberately mirrors `ProductFormValues` except
 * `images`/`videos` are still raw detected URLs (not yet Cloudinary-hosted;
 * see product-import.actions.ts's media ingestion step) and category/
 * collection are still slugs alongside their resolved ids.
 */
export interface NormalizedImportRow {
  slug: string;
  skuCode: string;
  barcode?: string;
  name: { en: string; hi: string; mr: string };
  description?: { en?: string; hi?: string; mr?: string };
  categorySlug: string;
  categoryId: string;
  collectionSlugs: string[];
  collectionIds: string[];
  metalType: "gold" | "silver" | "platinum" | "diamond" | "other";
  purity: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  makingChargeType: "percentage" | "per_gram" | "flat";
  makingChargeValue: number;
  gstPercentage: number;
  stoneValue: number;
  certificationCost: number;
  customCharges: number;
  quantity: number;
  availability: "in_showroom" | "made_to_order" | "reserved";
  isFeatured: boolean;
  isPublished: boolean;
  tags: string[];
  imageUrls: string[];
  videoUrls: string[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
}

/** Returned instead of a real batch when auto-detected headers can't confidently cover the required fields — drives the Field Mapping Wizard (Phase 6). */
export interface ImportMappingRequired {
  requiresMapping: true;
  headers: string[];
  suggestedMapping: Record<string, string>;
  missingRequiredFields: string[];
}
