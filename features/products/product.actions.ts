"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { calculatePrice } from "@/lib/pricing/calculate-price";
import { deleteImage } from "@/lib/cloudinary/upload";
import { logger } from "@/lib/logger";
import { ProductModel } from "@/features/products/product.model";
import {
  productFormSchema,
  type ProductFormInput,
} from "@/features/products/product.schema";
import { getCurrentRates } from "@/features/metal-rates/metal-rate.actions";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult, PaginatedResult } from "@/types/common";
import type {
  PriceBreakdown,
  Product,
} from "@/features/products/product.types";

interface ProductDoc {
  _id: unknown;
  tenantId: string;
  categoryId: unknown;
  slug: string;
  skuCode: string;
  name: Product["name"];
  description: Product["description"];
  metalType: Product["metalType"];
  purity: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  makingChargeType: Product["makingChargeType"];
  makingChargeValue: number;
  gstPercentage: number;
  quantity?: number;
  images: Product["images"];
  videos?: Product["videos"];
  availability?: Product["availability"];
  productionTimeDays?: Product["productionTimeDays"];
  dispatchNote?: string | null;
  deliveryEstimateDays?: Product["deliveryEstimateDays"];
  isFeatured: boolean;
  isPublished: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

function toProduct(doc: ProductDoc): Product {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    categoryId: String(doc.categoryId),
    slug: doc.slug,
    skuCode: doc.skuCode,
    name: doc.name,
    description: doc.description,
    metalType: doc.metalType,
    purity: doc.purity,
    grossWeightGrams: doc.grossWeightGrams,
    netWeightGrams: doc.netWeightGrams,
    makingChargeType: doc.makingChargeType,
    makingChargeValue: doc.makingChargeValue,
    gstPercentage: doc.gstPercentage,
    quantity: doc.quantity ?? 0,
    images: doc.images,
    videos: doc.videos ?? [],
    availability: doc.availability ?? "in_showroom",
    productionTimeDays: doc.productionTimeDays ?? undefined,
    dispatchNote: doc.dispatchNote ?? undefined,
    deliveryEstimateDays: doc.deliveryEstimateDays ?? undefined,
    isFeatured: doc.isFeatured,
    isPublished: doc.isPublished,
    tags: doc.tags,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export interface ProductWithPrice {
  product: Product;
  price: PriceBreakdown;
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";

export interface ListProductsParams {
  categoryId?: string;
  metalType?: Product["metalType"];
  /** Case-insensitive match against name/tags — powers the header search. */
  query?: string;
  featuredOnly?: boolean;
  /** e.g. "made_to_order" — powers the homepage's "Online Exclusive" section. */
  availability?: Product["availability"];
  page?: number;
  pageSize?: number;
  publishedOnly?: boolean;
  sort?: ProductSort;
}

/** Upper bound when a price-based sort forces an in-memory pass (see below). Fine at boutique-catalogue scale. */
const MAX_SORT_SCAN = 500;

/** Attaches the live calculated price (PRD §12) to a batch of products in one rate lookup. */
async function attachPrices(products: Product[]): Promise<ProductWithPrice[]> {
  const rates = await getCurrentRates();

  return products.map((product) => {
    const rate = product.metalType === "gold" ? rates.gold : rates.silver;
    return {
      product,
      price: calculatePrice({
        netWeightGrams: product.netWeightGrams,
        makingChargeType: product.makingChargeType,
        makingChargeValue: product.makingChargeValue,
        gstPercentage: product.gstPercentage,
        metalRatePerGram: rate?.ratePerGram ?? null,
        rateEffectiveDate: rate?.effectiveDate ?? null,
      }),
    };
  });
}

export async function listProducts({
  categoryId,
  metalType,
  query,
  featuredOnly,
  availability,
  page = 1,
  pageSize = 20,
  publishedOnly = true,
  sort = "newest",
}: ListProductsParams = {}): Promise<PaginatedResult<ProductWithPrice>> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (categoryId) filter.categoryId = categoryId;
  if (metalType) filter.metalType = metalType;
  if (availability) filter.availability = availability;
  if (featuredOnly) filter.isFeatured = true;
  if (publishedOnly) filter.isPublished = true;

  const trimmedQuery = query?.trim();
  // MongoDB $text search against the compound text index (name/SKU/tags/
  // description), ranked by relevance rather than a plain collection-scan
  // regex match.
  if (trimmedQuery) {
    filter.$text = { $search: trimmedQuery };
  }

  const total = await ProductModel.countDocuments(filter);
  const scoreProjection = trimmedQuery
    ? { score: { $meta: "textScore" } }
    : undefined;

  // Price is computed, never stored (PRD §12), so a price sort can't be
  // pushed down to MongoDB — fall back to fetching a bounded window,
  // pricing it, sorting in memory, then paginating. Fine at boutique
  // catalogue scale; revisit if the catalogue ever approaches MAX_SORT_SCAN.
  if (sort === "price_asc" || sort === "price_desc") {
    const docs = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(MAX_SORT_SCAN)
      .lean();

    const priced = await attachPrices(
      docs.map((doc) => toProduct(doc as unknown as ProductDoc)),
    );
    priced.sort((a, b) =>
      sort === "price_asc"
        ? a.price.total - b.price.total
        : b.price.total - a.price.total,
    );

    const start = (page - 1) * pageSize;
    return {
      items: priced.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  // A search query defaults to relevance ranking (textScore) unless the
  // caller explicitly asked for name order; otherwise fall back to newest.
  const mongoSort: Record<string, 1 | -1 | { $meta: "textScore" }> =
    sort === "name_asc"
      ? { "name.en": 1 }
      : trimmedQuery
        ? { score: { $meta: "textScore" } }
        : { createdAt: -1 };

  const docs = await ProductModel.find(filter, scoreProjection)
    .sort(mongoSort)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  const items = await attachPrices(
    docs.map((doc) => toProduct(doc as unknown as ProductDoc)),
  );

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Fetches a specific set of products by id, preserving no particular order (caller re-orders if needed) — powers Wishlist/Compare. */
export async function getProductsByIds(
  ids: string[],
): Promise<ProductWithPrice[]> {
  if (ids.length === 0) return [];

  await connectToDatabase();

  const docs = await ProductModel.find({
    tenantId: DEFAULT_TENANT_ID,
    _id: { $in: ids },
    isPublished: true,
    ...NOT_DELETED_FILTER,
  }).lean();

  return attachPrices(
    docs.map((doc) => toProduct(doc as unknown as ProductDoc)),
  );
}

/** Products in the same category as `excludeProductId`, for the "related products" rail. */
export async function listRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4,
): Promise<ProductWithPrice[]> {
  await connectToDatabase();

  const docs = await ProductModel.find({
    tenantId: DEFAULT_TENANT_ID,
    categoryId,
    isPublished: true,
    _id: { $ne: excludeProductId },
    ...NOT_DELETED_FILTER,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return attachPrices(
    docs.map((doc) => toProduct(doc as unknown as ProductDoc)),
  );
}

export async function getProductBySlug(
  slug: string,
): Promise<{ product: Product; price: PriceBreakdown } | null> {
  await connectToDatabase();

  const doc = await ProductModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug,
    isPublished: true,
    ...NOT_DELETED_FILTER,
  }).lean();

  if (!doc) return null;

  const product = toProduct(doc as unknown as ProductDoc);
  const rates = await getCurrentRates();
  const rate = product.metalType === "gold" ? rates.gold : rates.silver;

  const price = calculatePrice({
    netWeightGrams: product.netWeightGrams,
    makingChargeType: product.makingChargeType,
    makingChargeValue: product.makingChargeValue,
    gstPercentage: product.gstPercentage,
    metalRatePerGram: rate?.ratePerGram ?? null,
    rateEffectiveDate: rate?.effectiveDate ?? null,
  });

  return { product, price };
}

/** Admin listing — same shape as the public catalogue query but without the isPublished/deleted defaults hiding drafts. */
export async function listProductsForAdmin(
  params: ListProductsParams = {},
): Promise<PaginatedResult<ProductWithPrice>> {
  await requireAdmin();
  return listProducts({ publishedOnly: false, pageSize: 50, ...params });
}

export async function getProductByIdForAdmin(
  id: string,
): Promise<Product | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await ProductModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toProduct(doc as unknown as ProductDoc) : null;
}

export async function createProduct(
  values: ProductFormInput,
): Promise<ActionResult<Product>> {
  const session = await requirePermission("products.manage");

  const parsed = productFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid product data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await ProductModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    $or: [{ slug: parsed.data.slug }, { skuCode: parsed.data.skuCode }],
  });
  if (existing) {
    return {
      success: false,
      error: "A product with this slug or SKU already exists",
    };
  }

  const doc = await ProductModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "product", String(doc._id), doc.name.en);
  revalidatePath(ROUTES.admin.products);
  return {
    success: true,
    data: toProduct(doc.toObject() as unknown as ProductDoc),
  };
}

export async function updateProduct(
  id: string,
  values: ProductFormInput,
): Promise<ActionResult<Product>> {
  const session = await requirePermission("products.manage");

  const parsed = productFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid product data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const before = await ProductModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  })
    .select("images")
    .lean();

  const doc = await ProductModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Product not found" };
  }

  // Clean up Cloudinary assets for any image that was removed/replaced in
  // this edit — otherwise every image swap leaves the old upload orphaned.
  if (before?.images?.length) {
    const newPublicIds = new Set(parsed.data.images.map((img) => img.publicId));
    const removedPublicIds = before.images
      .map((img) => img.publicId)
      .filter((publicId) => !newPublicIds.has(publicId));

    await Promise.all(
      removedPublicIds.map((publicId) =>
        deleteImage(publicId).catch((error) =>
          logger.error("updateProduct", "Cloudinary delete failed", {
            error,
            publicId,
          }),
        ),
      ),
    );
  }

  logAudit(session, "updated", "product", String(doc._id), doc.name.en);
  revalidatePath(ROUTES.admin.products);
  revalidatePath(`/product/${doc.slug}`);
  return {
    success: true,
    data: toProduct(doc.toObject() as unknown as ProductDoc),
  };
}

/** Soft delete — moves the product to the Recycle Bin instead of destroying it outright. */
export async function deleteProduct(id: string): Promise<ActionResult> {
  const session = await requirePermission("products.manage");
  await connectToDatabase();

  const doc = await ProductModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Product not found" };
  }

  logAudit(session, "deleted", "product", id, doc.name.en);
  revalidatePath(ROUTES.admin.products);
  return { success: true, data: undefined };
}
