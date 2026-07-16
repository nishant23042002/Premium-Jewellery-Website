"use server";

import Papa from "papaparse";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requirePermission } from "@/lib/auth/permissions";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { slugify } from "@/lib/utils/slugify";
import { logger } from "@/lib/logger";
import { ingestExternalImage, ingestExternalVideo } from "@/lib/media/ingest-external-media";
import { ProductModel } from "@/features/products/product.model";
import { CategoryModel } from "@/features/categories/category.model";
import { CollectionModel } from "@/features/collections/collection.model";
import { productFormSchema } from "@/features/products/product.schema";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/features/products/product.actions";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ImportBatchModel } from "@/features/import-export/product-import/import-batch.model";
import {
  detectColumnMapping,
  REQUIRED_INTERNAL_FIELDS,
  UPDATE_MODE_REQUIRED_FIELDS,
} from "@/features/import-export/product-import/column-mapping";
import {
  parseBooleanCell,
  parseMultiValueCell,
} from "@/features/import-export/product-import/parse-value";
import { ROUTES } from "@/constants/routes";
import type {
  ImportBatch,
  ImportBatchRow,
  ImportBatchSummary,
  ImportMappingRequired,
  ImportMode,
  NormalizedImportRow,
} from "@/features/import-export/product-import/import-batch.types";
import type { ActionResult } from "@/types/common";
import type { ProductFormInput } from "@/features/products/product.schema";

/** Hard cap on rows per file — this stays synchronous parse/validate work (no media I/O yet), so 5,000 rows is comfortably within one request even for a large catalogue export. Commit (Phase 4) is where per-row Cloudinary work needs batching, not this step. */
const MAX_IMPORT_ROWS = 5000;

/** Cloudinary folder for import-ingested media — kept distinct from admin-uploaded Media Library assets ("Ambika-Jewellers") so the two sources stay easy to tell apart. */
const IMPORT_MEDIA_FOLDER = "Ambika-Jewellers/imports";

/** Rows per `commitImportBatch` call — the wizard (Phase 6) loops this repeatedly for a large batch rather than one call processing everything. Kept small because media-heavy rows (external fetch + Cloudinary upload per image/video) are the slow part, not the validation work Phase 2 already did. */
const MAX_ROWS_PER_COMMIT_CALL = 25;

/**
 * Reuses `productFormSchema` wholesale — same field-level rules the
 * hand-edited product form enforces (weights, enums, SEO field lengths,
 * barcode, etc.) — swapping only `images`/`videos` (which expect
 * `{url,publicId,sortOrder}` objects from a completed Cloudinary upload)
 * for raw detected URL lists, since those haven't been ingested yet at
 * preview time (see Phase 3/4 for the ingest-then-commit step).
 */
const productImportRowSchema = productFormSchema
  .omit({ images: true, videos: true })
  .extend({
    imageUrls: z.array(z.string().url()).default([]),
    videoUrls: z.array(z.string().url()).default([]),
  });

/** Lowercases and collapses whitespace/hyphens to underscores, so "In Showroom" / "in-showroom" / "IN_SHOWROOM" all normalize to the exact enum value `productFormSchema` expects. */
function normalizeEnumValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/**
 * A field with no sensible hardcoded default (e.g. `metalType`) — in "full"
 * mode an absent cell is left `undefined` (surfaces as a normal validation
 * error), in "update" mode it falls back to the matched product's current
 * value, so an unmapped column means "leave this field alone" rather than
 * "reset it."
 */
function requiredField<T, U>(
  mapped: T | undefined,
  existingValue: U | undefined,
  mode: ImportMode,
): T | U | undefined {
  return mapped ?? (mode === "update" ? existingValue : undefined);
}

/**
 * A field that already carries a schema `.default()` in "full" mode (e.g.
 * `gstPercentage` -> 3) — "update" mode prefers the matched product's
 * current value over that hardcoded default when the column isn't mapped.
 */
function defaultedField<T, U>(
  mapped: T | undefined,
  existingValue: U | undefined,
  mode: ImportMode,
  fallback: T,
): T | U {
  return mapped ?? (mode === "update" ? (existingValue ?? fallback) : fallback);
}

interface ImportBatchDoc {
  _id: unknown;
  tenantId: string;
  adminId: string;
  adminEmail: string;
  fileName: string;
  originalRowCount: number;
  mode: ImportMode;
  fieldMapping: Record<string, string>;
  status: ImportBatch["status"];
  rows: unknown[];
  counts: ImportBatch["counts"];
  completedAt?: Date | null;
  undoneAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function toImportBatch(doc: ImportBatchDoc): ImportBatch {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    adminId: doc.adminId,
    adminEmail: doc.adminEmail,
    fileName: doc.fileName,
    originalRowCount: doc.originalRowCount,
    mode: doc.mode,
    fieldMapping: doc.fieldMapping,
    status: doc.status,
    rows: doc.rows as unknown as ImportBatchRow[],
    counts: doc.counts,
    completedAt: doc.completedAt?.toISOString(),
    undoneAt: doc.undoneAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Full lean Product doc (not the narrow slug/skuCode/barcode-only lookup
 * projection Phase 2 originally used) — "update" mode needs every field's
 * current value available as a fallback for whatever the CSV doesn't
 * mention, so the duplicate-detection fetch is reused instead of adding a
 * second query.
 */
interface ExistingProductFull {
  _id: unknown;
  slug: string;
  skuCode: string;
  barcode?: string | null;
  categoryId: unknown;
  name: { en: string; hi: string; mr: string };
  description?: { en?: string; hi?: string; mr?: string };
  metalType: string;
  purity: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  makingChargeType: string;
  makingChargeValue: number;
  gstPercentage: number;
  stoneValue?: number;
  certificationCost?: number;
  customCharges?: number;
  quantity?: number;
  availability?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
}

/**
 * Steps 2-6 of the import wizard (Read CSV -> Validate -> Detect Images ->
 * Detect Videos -> Preview) in one pass: parses the CSV, auto-detects (or
 * applies a caller-supplied override for) column mapping, resolves
 * category/collection slugs, validates every row against the exact
 * `productFormSchema` the hand-edited product form uses, checks SKU/slug/
 * barcode duplicates both against existing products and within the file
 * itself, and persists everything as a "previewing" `ImportBatch`. No
 * product writes happen here — see commitImportBatch (Phase 4).
 */
export async function parseAndValidateImport(
  fileName: string,
  csvText: string,
  mappingOverride?: Record<string, string>,
  mode: ImportMode = "full",
): Promise<ActionResult<ImportBatch | ImportMappingRequired>> {
  const session = await requirePermission("import_export.manage");

  const rateLimit = await checkRateLimit(`product-import:admin:${session.sub}`, {
    limit: 10,
    windowMs: 60 * 60_000,
  });
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Too many imports started recently. Please try again in a while.",
    };
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    return {
      success: false,
      error: `Couldn't parse CSV: ${parsed.errors[0].message}`,
    };
  }
  if (parsed.data.length === 0) {
    return { success: false, error: "The CSV has no data rows." };
  }
  if (parsed.data.length > MAX_IMPORT_ROWS) {
    return {
      success: false,
      error: `This file has ${parsed.data.length} rows — the importer handles up to ${MAX_IMPORT_ROWS} at a time. Split it into smaller files.`,
    };
  }

  const headers = parsed.meta.fields ?? [];

  let fieldMapping: Record<string, string>;
  if (mappingOverride) {
    fieldMapping = mappingOverride;
  } else {
    const requiredFields =
      mode === "update" ? UPDATE_MODE_REQUIRED_FIELDS : REQUIRED_INTERNAL_FIELDS;
    const detection = detectColumnMapping(headers, requiredFields);
    if (detection.missingRequiredFields.length > 0) {
      return {
        success: true,
        data: {
          requiresMapping: true,
          headers,
          suggestedMapping: detection.mapping,
          missingRequiredFields: [...detection.missingRequiredFields],
        },
      };
    }
    fieldMapping = detection.mapping;
  }

  await connectToDatabase();

  const [categories, collections] = await Promise.all([
    CategoryModel.find({ tenantId: DEFAULT_TENANT_ID }).select("slug").lean(),
    CollectionModel.find({ tenantId: DEFAULT_TENANT_ID }).select("slug").lean(),
  ]);
  const categoryIdBySlug = new Map(
    categories.map((c) => [c.slug, String(c._id)]),
  );
  const collectionIdBySlug = new Map(
    collections.map((c) => [c.slug, String(c._id)]),
  );

  function cell(row: Record<string, string>, field: string): string | undefined {
    const column = fieldMapping[field];
    if (!column) return undefined;
    return row[column]?.trim() || undefined;
  }

  // Gather every identifier mentioned anywhere in the file up front, so
  // duplicate-vs-existing-product detection is one query instead of N.
  const candidateSlugs: string[] = [];
  const candidateSkus: string[] = [];
  const candidateBarcodes: string[] = [];
  const preRows = parsed.data.map((row, index) => {
    const rowNumber = index + 2; // +1 for header, +1 for 1-indexing
    const nameEn = cell(row, "name_en");
    const rawSlug = cell(row, "slug");
    const slug = rawSlug ? slugify(rawSlug) : nameEn ? slugify(nameEn) : "";
    const skuCode = cell(row, "skuCode")?.toUpperCase() ?? "";
    const barcode = cell(row, "barcode");
    if (slug) candidateSlugs.push(slug);
    if (skuCode) candidateSkus.push(skuCode);
    if (barcode) candidateBarcodes.push(barcode);
    return { row, rowNumber, nameEn, slug, skuCode, barcode };
  });

  const identifierClauses: Record<string, unknown>[] = [];
  if (candidateSlugs.length) identifierClauses.push({ slug: { $in: candidateSlugs } });
  if (candidateSkus.length) identifierClauses.push({ skuCode: { $in: candidateSkus } });
  if (candidateBarcodes.length) identifierClauses.push({ barcode: { $in: candidateBarcodes } });

  const existingProducts: ExistingProductFull[] = identifierClauses.length
    ? ((await ProductModel.find({
        tenantId: DEFAULT_TENANT_ID,
        $or: identifierClauses,
      }).lean()) as unknown as ExistingProductFull[])
    : [];

  const existingBySlug = new Map(existingProducts.map((p) => [p.slug, String(p._id)]));
  const existingBySku = new Map(existingProducts.map((p) => [p.skuCode, String(p._id)]));
  const existingByBarcode = new Map(
    existingProducts
      .filter((p): p is ExistingProductFull & { barcode: string } => !!p.barcode)
      .map((p) => [p.barcode, String(p._id)]),
  );
  const existingById = new Map(existingProducts.map((p) => [String(p._id), p]));

  const seenSlugsInFile = new Set<string>();
  const seenSkusInFile = new Set<string>();

  const rows: ImportBatchRow[] = preRows.map(
    ({ row, rowNumber, nameEn, slug: rawSlug, skuCode, barcode: rawBarcode }) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const matchedProductId =
        existingBySku.get(skuCode) ??
        existingBySlug.get(rawSlug) ??
        (rawBarcode ? existingByBarcode.get(rawBarcode) : undefined);
      const matchType = existingBySku.has(skuCode)
        ? "sku"
        : existingBySlug.has(rawSlug)
          ? "slug"
          : rawBarcode && existingByBarcode.has(rawBarcode)
            ? "barcode"
            : undefined;
      const existing = matchedProductId ? existingById.get(matchedProductId) : undefined;

      if (mode === "update" && !matchedProductId) {
        errors.push(
          "No matching product found for this SKU — bulk update mode only updates existing products",
        );
      }

      const slug = rawSlug || (mode === "update" ? (existing?.slug ?? "") : "");
      const barcode = requiredField(rawBarcode, existing?.barcode ?? undefined, mode);

      if (!slug) errors.push("Missing slug (and no name to derive one from)");
      else if (seenSlugsInFile.has(slug)) errors.push(`Duplicate slug "${slug}" earlier in this file`);
      if (slug) seenSlugsInFile.add(slug);

      if (!skuCode) errors.push("Missing SKU");
      else if (seenSkusInFile.has(skuCode)) errors.push(`Duplicate SKU "${skuCode}" earlier in this file`);
      if (skuCode) seenSkusInFile.add(skuCode);

      const categorySlugRaw = cell(row, "categorySlug") ?? "";
      const categorySlug = categorySlugRaw ? slugify(categorySlugRaw) : "";
      let categoryId: string | undefined;
      if (categorySlugRaw) {
        categoryId = categoryIdBySlug.get(categorySlug);
        if (!categoryId) errors.push(`Unknown category "${categorySlugRaw}"`);
      } else {
        categoryId = requiredField(undefined, existing ? String(existing.categoryId) : undefined, mode);
        if (!categoryId) errors.push("Missing category");
      }

      const collectionSlugsRaw = parseMultiValueCell(cell(row, "collectionSlugs"));
      const collectionSlugs = collectionSlugsRaw.map(slugify);
      const collectionIds: string[] = [];
      collectionSlugs.forEach((cSlug, i) => {
        const id = collectionIdBySlug.get(cSlug);
        if (id) {
          collectionIds.push(id);
        } else {
          warnings.push(`Unknown collection "${collectionSlugsRaw[i]}" — skipped`);
        }
      });

      const imageUrls = parseMultiValueCell(cell(row, "images"));
      const videoUrls = parseMultiValueCell(cell(row, "videos"));

      const nameEnCell = nameEn;
      const nameHiCell = cell(row, "name_hi");
      const nameMrCell = cell(row, "name_mr");
      const descriptionEnCell = cell(row, "description_en");
      const isFeaturedCell = cell(row, "isFeatured");
      const isPublishedCell = cell(row, "isPublished");
      const tagsCell = cell(row, "tags");

      let normalizedData: NormalizedImportRow | undefined;
      if (errors.length === 0 && categoryId) {
        const candidate = {
          categoryId,
          slug,
          skuCode,
          barcode,
          name: {
            en: defaultedField(nameEnCell, existing?.name.en, mode, ""),
            hi: defaultedField(nameHiCell, existing?.name.hi, mode, ""),
            mr: defaultedField(nameMrCell, existing?.name.mr, mode, ""),
          },
          description: {
            en: requiredField(descriptionEnCell, existing?.description?.en, mode),
          },
          metalType: requiredField(normalizeEnumValue(cell(row, "metalType")), existing?.metalType, mode),
          purity: requiredField(cell(row, "purity"), existing?.purity, mode),
          grossWeightGrams: requiredField(
            cell(row, "grossWeightGrams"),
            existing?.grossWeightGrams,
            mode,
          ),
          netWeightGrams: requiredField(cell(row, "netWeightGrams"), existing?.netWeightGrams, mode),
          makingChargeType: defaultedField(
            normalizeEnumValue(cell(row, "makingChargeType")),
            existing?.makingChargeType,
            mode,
            "percentage",
          ),
          makingChargeValue: requiredField(
            cell(row, "makingChargeValue"),
            existing?.makingChargeValue,
            mode,
          ),
          gstPercentage: defaultedField(cell(row, "gstPercentage"), existing?.gstPercentage, mode, "3"),
          stoneValue: defaultedField(cell(row, "stoneValue"), existing?.stoneValue, mode, "0"),
          certificationCost: defaultedField(
            cell(row, "certificationCost"),
            existing?.certificationCost,
            mode,
            "0",
          ),
          customCharges: defaultedField(cell(row, "customCharges"), existing?.customCharges, mode, "0"),
          quantity: defaultedField(cell(row, "quantity"), existing?.quantity, mode, "0"),
          availability: defaultedField(
            normalizeEnumValue(cell(row, "availability")),
            existing?.availability,
            mode,
            "in_showroom",
          ),
          isFeatured: defaultedField(
            isFeaturedCell !== undefined ? parseBooleanCell(isFeaturedCell) : undefined,
            existing?.isFeatured,
            mode,
            false,
          ),
          isPublished: defaultedField(
            isPublishedCell !== undefined ? parseBooleanCell(isPublishedCell) : undefined,
            existing?.isPublished,
            mode,
            false,
          ),
          tags: defaultedField(
            tagsCell !== undefined ? parseMultiValueCell(tagsCell) : undefined,
            existing?.tags,
            mode,
            [] as string[],
          ),
          imageUrls,
          videoUrls,
          metaTitle: requiredField(cell(row, "metaTitle"), existing?.metaTitle, mode),
          metaDescription: requiredField(cell(row, "metaDescription"), existing?.metaDescription, mode),
          canonicalUrl: requiredField(cell(row, "canonicalUrl"), existing?.canonicalUrl, mode),
          ogTitle: requiredField(cell(row, "ogTitle"), existing?.ogTitle, mode),
          ogDescription: requiredField(cell(row, "ogDescription"), existing?.ogDescription, mode),
          ogImageUrl: requiredField(cell(row, "ogImageUrl"), existing?.ogImageUrl, mode),
        };

        const validated = productImportRowSchema.safeParse(candidate);
        if (!validated.success) {
          for (const issue of validated.error.issues) {
            errors.push(`${issue.path.join(".")}: ${issue.message}`);
          }
        } else {
          normalizedData = {
            ...validated.data,
            categorySlug: categorySlugRaw,
            collectionSlugs,
            collectionIds,
          } as NormalizedImportRow;
        }
      }

      const finalErrors = errors.length > 0 ? errors : undefined;
      const status: ImportBatchRow["status"] = finalErrors
        ? "error"
        : warnings.length > 0
          ? "warning"
          : "valid";

      return {
        rowNumber,
        sourceData: row,
        status,
        errors,
        warnings,
        plannedAction: finalErrors
          ? undefined
          : matchedProductId
            ? "update"
            : "create",
        matchedProductId,
        matchType,
        normalizedData,
      };
    },
  );

  const doc = await ImportBatchModel.create({
    tenantId: DEFAULT_TENANT_ID,
    adminId: session.sub,
    adminEmail: session.email,
    fileName,
    originalRowCount: parsed.data.length,
    mode,
    fieldMapping,
    status: "previewing",
    rows,
    counts: {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      mediaUploaded: 0,
      mediaFailed: 0,
    },
  });

  logAudit(session, "previewed", "import_batch", String(doc._id), fileName, {
    rowCount: parsed.data.length,
    errorRows: rows.filter((r) => r.status === "error").length,
    warningRows: rows.filter((r) => r.status === "warning").length,
  });

  return {
    success: true,
    data: toImportBatch(doc.toObject() as unknown as ImportBatchDoc),
  };
}

export async function getImportBatch(id: string): Promise<ImportBatch | null> {
  await requirePermission("import_export.manage");
  await connectToDatabase();

  const doc = await ImportBatchModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();

  return doc ? toImportBatch(doc as unknown as ImportBatchDoc) : null;
}

interface ImportedImage {
  url: string;
  publicId: string;
  sortOrder: number;
}

interface ImportedVideo {
  url: string;
  publicId: string;
  title?: string;
}

interface RowMediaResult {
  images: ImportedImage[];
  videos: ImportedVideo[];
  mediaWarnings: string[];
  uploadedCount: number;
  failedCount: number;
}

/**
 * Downloads and uploads every image/video URL detected on a row. A failed
 * individual asset doesn't fail the row — it becomes a warning and the
 * product still gets created/updated with whatever media did succeed,
 * matching Shopify's own "partial success" import behavior rather than
 * losing an entire product over one broken image URL.
 */
async function ingestRowMedia(normalized: NormalizedImportRow): Promise<RowMediaResult> {
  const images: ImportedImage[] = [];
  const videos: ImportedVideo[] = [];
  const mediaWarnings: string[] = [];
  let uploadedCount = 0;
  let failedCount = 0;

  for (const [index, url] of normalized.imageUrls.entries()) {
    const result = await ingestExternalImage(url, IMPORT_MEDIA_FOLDER);
    if (result.success) {
      images.push({ url: result.data.url, publicId: result.data.publicId, sortOrder: index });
      uploadedCount += 1;
    } else {
      mediaWarnings.push(`Image ${index + 1} (${url}): ${result.error}`);
      failedCount += 1;
    }
  }

  for (const url of normalized.videoUrls) {
    const result = await ingestExternalVideo(url, IMPORT_MEDIA_FOLDER);
    if (result.success) {
      videos.push({ url: result.data.url, publicId: result.data.publicId });
      uploadedCount += 1;
    } else {
      mediaWarnings.push(`Video (${url}): ${result.error}`);
      failedCount += 1;
    }
  }

  return { images, videos, mediaWarnings, uploadedCount, failedCount };
}

/** Maps a validated import row + its ingested media into the exact shape createProduct/updateProduct expect — the same form payload a hand-edited product submit would produce. */
function toProductFormInput(
  row: NormalizedImportRow,
  images: ImportedImage[],
  videos: ImportedVideo[],
): ProductFormInput {
  return {
    categoryId: row.categoryId,
    slug: row.slug,
    skuCode: row.skuCode,
    barcode: row.barcode,
    name: row.name,
    description: row.description,
    metalType: row.metalType,
    purity: row.purity,
    grossWeightGrams: row.grossWeightGrams,
    netWeightGrams: row.netWeightGrams,
    makingChargeType: row.makingChargeType,
    makingChargeValue: row.makingChargeValue,
    gstPercentage: row.gstPercentage,
    stoneValue: row.stoneValue,
    certificationCost: row.certificationCost,
    customCharges: row.customCharges,
    quantity: row.quantity,
    images,
    videos,
    availability: row.availability,
    isFeatured: row.isFeatured,
    isPublished: row.isPublished,
    tags: row.tags,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    canonicalUrl: row.canonicalUrl,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImageUrl: row.ogImageUrl,
  };
}

interface ExistingProductMedia {
  images: ImportedImage[];
  videos: ImportedVideo[];
}

interface CommitBatchResult {
  batch: ImportBatch;
  remainingRowNumbers: number[];
}

/**
 * Commits up to `MAX_ROWS_PER_COMMIT_CALL` rows of a previewed batch —
 * called repeatedly by the wizard (Phase 6) until `remainingRowNumbers` is
 * empty, rather than one call processing everything, since per-row media
 * ingestion is real I/O that can't safely run hundreds-deep inside a single
 * serverless invocation. Every actual product write goes through the exact
 * same `createProduct`/`updateProduct` a hand-edited form submit calls —
 * this function's job is resolving media and orchestrating the loop, not
 * reimplementing product-write logic.
 */
export async function commitImportBatch(
  batchId: string,
  rowNumbers: number[],
): Promise<ActionResult<CommitBatchResult>> {
  const session = await requirePermission("import_export.manage");

  if (rowNumbers.length === 0) {
    return { success: false, error: "No rows specified to commit" };
  }
  if (rowNumbers.length > MAX_ROWS_PER_COMMIT_CALL) {
    return {
      success: false,
      error: `Commit at most ${MAX_ROWS_PER_COMMIT_CALL} rows per call.`,
    };
  }

  const rateLimit = await checkRateLimit(`product-import-commit:admin:${session.sub}`, {
    limit: 300,
    windowMs: 60 * 60_000,
  });
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Too many import commit requests. Please try again in a while.",
    };
  }

  await connectToDatabase();

  const doc = await ImportBatchModel.findOne({ _id: batchId, tenantId: DEFAULT_TENANT_ID });
  if (!doc) {
    return { success: false, error: "Import batch not found" };
  }
  if (doc.adminId !== session.sub) {
    return { success: false, error: "You can only commit an import batch you started." };
  }
  if (doc.status === "completed" || doc.status === "undone") {
    return { success: false, error: `This import batch is already ${doc.status}.` };
  }

  const rowsByNumber = new Map(doc.rows.map((r) => [r.rowNumber, r]));

  for (const rowNumber of rowNumbers) {
    const row = rowsByNumber.get(rowNumber);
    if (!row) continue; // unknown row number — ignore rather than fail the whole call
    if (row.status === "committed") continue; // idempotent — a retried call shouldn't redo work

    if (row.status === "error" || !row.plannedAction || row.plannedAction === "skip") {
      row.status = "committed";
      row.resultAction = "skipped";
      doc.counts.skipped += 1;
      continue;
    }

    const normalized = row.normalizedData as unknown as NormalizedImportRow | undefined;
    if (!normalized) {
      row.status = "committed";
      row.resultAction = "skipped";
      row.errors.push("No validated data to commit");
      doc.counts.skipped += 1;
      continue;
    }

    try {
      let existingMedia: ExistingProductMedia = { images: [], videos: [] };

      if (row.plannedAction === "update" && row.matchedProductId) {
        const existingDoc = await ProductModel.findOne({
          _id: row.matchedProductId,
          tenantId: DEFAULT_TENANT_ID,
        }).lean();
        if (!existingDoc) {
          row.status = "error";
          row.errors.push("Matched product no longer exists");
          doc.counts.failed += 1;
          continue;
        }
        // Round-trip through JSON so ObjectId/Date instances become plain
        // strings before this ever crosses the Server Action serialization
        // boundary (same pattern as backup.actions.ts) — a raw lean() doc
        // stored as-is here previously crashed the client with "Only plain
        // objects can be passed to Client Components from Server
        // Components" whenever a batch containing an update row was
        // returned to the wizard.
        row.beforeSnapshot = JSON.parse(JSON.stringify(existingDoc));
        existingMedia = {
          images: (existingDoc.images ?? []) as unknown as ImportedImage[],
          videos: (existingDoc.videos ?? []) as unknown as ImportedVideo[],
        };
      }

      const ingested = await ingestRowMedia(normalized);
      doc.counts.mediaUploaded += ingested.uploadedCount;
      doc.counts.mediaFailed += ingested.failedCount;
      if (ingested.mediaWarnings.length > 0) {
        row.warnings.push(...ingested.mediaWarnings);
      }

      // A row with no images/videos mentioned at all means "don't touch
      // existing media" on an update, not "wipe it" — the same full-replace
      // footgun already flagged for bulk publish/unpublish in
      // products-table.tsx. Only replace when the CSV actually specified
      // media for this row.
      const finalImages = normalized.imageUrls.length > 0 ? ingested.images : existingMedia.images;
      const finalVideos = normalized.videoUrls.length > 0 ? ingested.videos : existingMedia.videos;

      const formInput = toProductFormInput(normalized, finalImages, finalVideos);

      const result =
        row.plannedAction === "update" && row.matchedProductId
          ? await updateProduct(row.matchedProductId, formInput)
          : await createProduct(formInput);

      if (!result.success) {
        row.status = "error";
        row.errors.push(result.error);
        doc.counts.failed += 1;
        continue;
      }

      row.status = "committed";
      row.resultAction = row.plannedAction === "update" ? "updated" : "created";
      row.resultProductId = result.data.id;
      doc.counts[row.plannedAction === "update" ? "updated" : "created"] += 1;

      if (normalized.collectionIds.length > 0) {
        const productId = result.data.id;
        await Promise.all(
          normalized.collectionIds.map((collectionId) =>
            CollectionModel.updateOne(
              { _id: collectionId, tenantId: DEFAULT_TENANT_ID },
              { $addToSet: { productIds: productId } },
            ).catch((error) =>
              logger.error("commitImportBatch", "failed to add product to collection", {
                error,
                collectionId,
                productId,
              }),
            ),
          ),
        );
      }
    } catch (error) {
      row.status = "error";
      row.errors.push(
        error instanceof Error ? error.message : "Unexpected error while committing this row",
      );
      doc.counts.failed += 1;
    }
  }

  const stillPending = doc.rows.some((r) => r.status === "valid" || r.status === "warning");
  doc.status = stillPending ? "committing" : "completed";
  if (!stillPending) {
    doc.completedAt = new Date();
  }

  // rows/counts hold Mixed-typed subfields (normalizedData, beforeSnapshot)
  // that Mongoose's change detection doesn't reliably pick up from in-place
  // mutation — mark both explicitly so the save actually persists them.
  doc.markModified("rows");
  doc.markModified("counts");
  await doc.save();

  if (!stillPending) {
    logAudit(session, "committed", "import_batch", String(doc._id), doc.fileName, {
      created: doc.counts.created,
      updated: doc.counts.updated,
      skipped: doc.counts.skipped,
      failed: doc.counts.failed,
    });
    revalidatePath(ROUTES.admin.products);
  }

  const remainingRowNumbers = doc.rows
    .filter((r) => r.status === "valid" || r.status === "warning")
    .map((r) => r.rowNumber);

  return {
    success: true,
    data: {
      batch: toImportBatch(doc.toObject() as unknown as ImportBatchDoc),
      remainingRowNumbers,
    },
  };
}

interface ImportBatchSummaryDoc {
  _id: unknown;
  fileName: string;
  adminEmail: string;
  status: ImportBatch["status"];
  counts: ImportBatch["counts"];
  originalRowCount: number;
  completedAt?: Date | null;
  undoneAt?: Date | null;
  createdAt: Date;
}

/** Powers the Import History list — a lightweight projection (no `rows`, which can be large) sorted newest-first. */
export async function listImportBatches(limit = 20): Promise<ImportBatchSummary[]> {
  await requirePermission("import_export.manage");
  await connectToDatabase();

  const docs: ImportBatchSummaryDoc[] = await ImportBatchModel.find({
    tenantId: DEFAULT_TENANT_ID,
  })
    .select("fileName adminEmail status counts originalRowCount completedAt undoneAt createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return docs.map((doc) => ({
    id: String(doc._id),
    fileName: doc.fileName,
    adminEmail: doc.adminEmail,
    status: doc.status,
    counts: doc.counts,
    rowCount: doc.originalRowCount,
    completedAt: doc.completedAt?.toISOString(),
    undoneAt: doc.undoneAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  }));
}

/** Row-per-line CSV report of a batch's outcome — same `Papa.unparse` already used by the existing product exporter. */
export async function exportImportBatchReport(
  batchId: string,
): Promise<ActionResult<string>> {
  await requirePermission("import_export.manage");
  await connectToDatabase();

  const doc = await ImportBatchModel.findOne({
    _id: batchId,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  if (!doc) {
    return { success: false, error: "Import batch not found" };
  }

  const skuColumn = doc.fieldMapping.skuCode;
  const slugColumn = doc.fieldMapping.slug;

  const reportRows = (doc.rows as unknown as ImportBatchRow[]).map((row) => ({
    row: row.rowNumber,
    status: row.status,
    action: row.resultAction ?? row.plannedAction ?? "",
    sku: skuColumn ? (row.sourceData[skuColumn] ?? "") : "",
    slug: slugColumn ? (row.sourceData[slugColumn] ?? "") : "",
    productId: row.resultProductId ?? "",
    errors: row.errors.join("; "),
    warnings: row.warnings.join("; "),
  }));

  return { success: true, data: Papa.unparse(reportRows) };
}

interface ProductSnapshot {
  categoryId: unknown;
  slug: string;
  skuCode: string;
  barcode?: string | null;
  name: { en: string; hi: string; mr: string };
  description?: { en?: string; hi?: string; mr?: string };
  metalType: string;
  purity: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  makingChargeType: string;
  makingChargeValue: number;
  gstPercentage: number;
  stoneValue?: number;
  certificationCost?: number;
  customCharges?: number;
  priceOverride?: { locked: boolean; fixedPrice?: number };
  quantity?: number;
  images?: { url: string; publicId: string; sortOrder?: number }[];
  videos?: { url: string; publicId: string; title?: string }[];
  availability?: string;
  productionTimeDays?: { min: number; max: number };
  dispatchNote?: string;
  deliveryEstimateDays?: { min: number; max: number };
  isFeatured?: boolean;
  isPublished?: boolean;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
}

/** Rebuilds the form payload `updateProduct` expects from a captured pre-import snapshot — the inverse of `toProductFormInput`, used only by `undoImportBatch` to restore a row's prior state. */
function snapshotToFormInput(snapshot: ProductSnapshot): ProductFormInput {
  return {
    categoryId: String(snapshot.categoryId),
    slug: snapshot.slug,
    skuCode: snapshot.skuCode,
    barcode: snapshot.barcode ?? undefined,
    name: snapshot.name,
    description: snapshot.description,
    metalType: snapshot.metalType as ProductFormInput["metalType"],
    purity: snapshot.purity,
    grossWeightGrams: snapshot.grossWeightGrams,
    netWeightGrams: snapshot.netWeightGrams,
    makingChargeType: snapshot.makingChargeType as ProductFormInput["makingChargeType"],
    makingChargeValue: snapshot.makingChargeValue,
    gstPercentage: snapshot.gstPercentage,
    stoneValue: snapshot.stoneValue ?? 0,
    certificationCost: snapshot.certificationCost ?? 0,
    customCharges: snapshot.customCharges ?? 0,
    priceOverride: snapshot.priceOverride ?? { locked: false },
    quantity: snapshot.quantity ?? 0,
    images: (snapshot.images ?? []).map((img, index) => ({
      url: img.url,
      publicId: img.publicId,
      sortOrder: img.sortOrder ?? index,
    })),
    videos: (snapshot.videos ?? []).map((video) => ({
      url: video.url,
      publicId: video.publicId,
      title: video.title,
    })),
    availability: (snapshot.availability ?? "in_showroom") as ProductFormInput["availability"],
    productionTimeDays: snapshot.productionTimeDays,
    dispatchNote: snapshot.dispatchNote,
    deliveryEstimateDays: snapshot.deliveryEstimateDays,
    isFeatured: snapshot.isFeatured ?? false,
    isPublished: snapshot.isPublished ?? false,
    tags: snapshot.tags ?? [],
    metaTitle: snapshot.metaTitle,
    metaDescription: snapshot.metaDescription,
    canonicalUrl: snapshot.canonicalUrl,
    ogTitle: snapshot.ogTitle,
    ogDescription: snapshot.ogDescription,
    ogImageUrl: snapshot.ogImageUrl,
  };
}

export interface UndoBatchResult {
  restoredCount: number;
  deletedCount: number;
  failedCount: number;
}

/**
 * Reverses a completed batch: rows this import created are soft-deleted
 * (the same recycle-bin `deletedAt` convention every other content model in
 * this app already uses — reused via `deleteProduct`, not reimplemented),
 * rows it updated are restored via `updateProduct` with the captured
 * pre-import snapshot as the payload — which also gets `updateProduct`'s
 * existing Cloudinary cleanup diff for free, since "restore old images"
 * and "the new update replaced these images" are the same code path.
 *
 * Best-effort, not all-or-nothing: one row failing to undo (e.g. the
 * product was deleted by someone else since) doesn't block undoing the
 * rest. Does not detect or warn about manual edits made to a product after
 * the import and before the undo — this restores the pre-import snapshot
 * unconditionally, the same way a single "undo" action would.
 */
export async function undoImportBatch(
  batchId: string,
): Promise<ActionResult<UndoBatchResult>> {
  const session = await requirePermission("import_export.manage");
  await connectToDatabase();

  const doc = await ImportBatchModel.findOne({ _id: batchId, tenantId: DEFAULT_TENANT_ID });
  if (!doc) {
    return { success: false, error: "Import batch not found" };
  }
  if (doc.adminId !== session.sub) {
    return { success: false, error: "You can only undo an import batch you started." };
  }
  if (doc.status !== "completed") {
    return {
      success: false,
      error: `Only a completed import can be undone (this one is ${doc.status}).`,
    };
  }

  let restoredCount = 0;
  let deletedCount = 0;
  let failedCount = 0;

  for (const row of doc.rows) {
    try {
      if (row.resultAction === "created" && row.resultProductId) {
        const result = await deleteProduct(row.resultProductId);
        if (result.success) {
          deletedCount += 1;
        } else {
          failedCount += 1;
          row.warnings.push(`Undo failed: ${result.error}`);
        }
      } else if (row.resultAction === "updated" && row.resultProductId && row.beforeSnapshot) {
        const formInput = snapshotToFormInput(row.beforeSnapshot as unknown as ProductSnapshot);
        const result = await updateProduct(row.resultProductId, formInput);
        if (result.success) {
          restoredCount += 1;
        } else {
          failedCount += 1;
          row.warnings.push(`Undo failed: ${result.error}`);
        }
      }
    } catch (error) {
      failedCount += 1;
      row.warnings.push(
        `Undo failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
      );
    }
  }

  doc.status = "undone";
  doc.undoneAt = new Date();
  doc.markModified("rows");
  await doc.save();

  logAudit(session, "undone", "import_batch", String(doc._id), doc.fileName, {
    restoredCount,
    deletedCount,
    failedCount,
  });
  revalidatePath(ROUTES.admin.products);

  return { success: true, data: { restoredCount, deletedCount, failedCount } };
}
