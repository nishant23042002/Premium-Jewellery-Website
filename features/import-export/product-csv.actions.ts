"use server";

import Papa from "papaparse";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { ProductModel } from "@/features/products/product.model";
import { CategoryModel } from "@/features/categories/category.model";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { productCsvRowSchema } from "@/features/import-export/product-csv.schema";
import { ROUTES } from "@/constants/routes";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/common";

/**
 * Flat, spreadsheet-friendly product columns — deliberately excludes
 * images/videos (not representable well in CSV); admin adds media via the
 * regular Product form after import.
 */
const CSV_COLUMNS = [
  "slug",
  "skuCode",
  "name_en",
  "name_hi",
  "name_mr",
  "categorySlug",
  "metalType",
  "purity",
  "grossWeightGrams",
  "netWeightGrams",
  "makingChargeType",
  "makingChargeValue",
  "gstPercentage",
  "quantity",
  "availability",
  "isFeatured",
  "isPublished",
  "tags",
] as const;

export async function exportProductsCsv(): Promise<ActionResult<string>> {
  await requirePermission("import_export.manage");
  await connectToDatabase();

  const [products, categories] = await Promise.all([
    ProductModel.find({ tenantId: DEFAULT_TENANT_ID }).lean(),
    CategoryModel.find({ tenantId: DEFAULT_TENANT_ID }).lean(),
  ]);

  const categoryNameById = new Map(
    categories.map((c) => [String(c._id), c.slug]),
  );

  const rows = products.map((p) => ({
    slug: p.slug,
    skuCode: p.skuCode,
    name_en: p.name.en,
    name_hi: p.name.hi,
    name_mr: p.name.mr,
    categorySlug: categoryNameById.get(String(p.categoryId)) ?? "",
    metalType: p.metalType,
    purity: p.purity,
    grossWeightGrams: p.grossWeightGrams,
    netWeightGrams: p.netWeightGrams,
    makingChargeType: p.makingChargeType,
    makingChargeValue: p.makingChargeValue,
    gstPercentage: p.gstPercentage,
    quantity: p.quantity ?? 0,
    availability: p.availability ?? "in_showroom",
    isFeatured: p.isFeatured,
    isPublished: p.isPublished,
    tags: (p.tags ?? []).join(";"),
  }));

  const csv = Papa.unparse({ fields: [...CSV_COLUMNS], data: rows });
  return { success: true, data: csv };
}

export interface ImportSummary {
  created: number;
  updated: number;
  errors: string[];
}

export async function importProductsCsv(
  csvText: string,
): Promise<ActionResult<ImportSummary>> {
  const session = await requirePermission("import_export.manage");
  await connectToDatabase();

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

  const categories = await CategoryModel.find({
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c._id]));

  const summary: ImportSummary = { created: 0, updated: 0, errors: [] };

  for (const [index, row] of parsed.data.entries()) {
    const rowNumber = index + 2; // +1 for header, +1 for 1-indexing

    const validated = productCsvRowSchema.safeParse(row);
    if (!validated.success) {
      const messages = validated.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      summary.errors.push(`Row ${rowNumber}: ${messages}`);
      continue;
    }
    const parsedRow = validated.data;

    const categoryId = categoryIdBySlug.get(parsedRow.categorySlug);
    if (!categoryId) {
      summary.errors.push(
        `Row ${rowNumber}: unknown category slug "${parsedRow.categorySlug}"`,
      );
      continue;
    }

    const doc = {
      tenantId: DEFAULT_TENANT_ID,
      slug: parsedRow.slug,
      skuCode: parsedRow.skuCode.toUpperCase(),
      name: {
        en: parsedRow.name_en,
        hi: parsedRow.name_hi,
        mr: parsedRow.name_mr,
      },
      categoryId,
      metalType: parsedRow.metalType,
      purity: parsedRow.purity,
      grossWeightGrams: parsedRow.grossWeightGrams,
      netWeightGrams: parsedRow.netWeightGrams,
      makingChargeType: parsedRow.makingChargeType,
      makingChargeValue: parsedRow.makingChargeValue,
      gstPercentage: parsedRow.gstPercentage,
      quantity: parsedRow.quantity,
      availability: parsedRow.availability,
      isFeatured: parsedRow.isFeatured,
      isPublished: parsedRow.isPublished,
      tags: parsedRow.tags,
    };

    try {
      const existing = await ProductModel.findOne({
        tenantId: DEFAULT_TENANT_ID,
        slug: parsedRow.slug,
      });

      if (existing) {
        await ProductModel.updateOne({ _id: existing._id }, doc);
        summary.updated += 1;
      } else {
        await ProductModel.create({
          ...doc,
          description: { en: "", hi: "", mr: "" },
          images: [],
          videos: [],
        });
        summary.created += 1;
      }
    } catch (error) {
      summary.errors.push(
        `Row ${rowNumber}: ${error instanceof Error ? error.message : "failed to save"}`,
      );
    }
  }

  logAudit(session, "imported", "product", undefined, undefined, {
    created: summary.created,
    updated: summary.updated,
    errorCount: summary.errors.length,
  });
  revalidatePath(ROUTES.admin.products);

  return { success: true, data: summary };
}
