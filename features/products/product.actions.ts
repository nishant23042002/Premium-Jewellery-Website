"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { calculatePrice, rateForMetalType } from "@/lib/pricing/calculate-price";
import { deleteImage } from "@/lib/cloudinary/upload";
import { logger } from "@/lib/logger";
import { ProductModel } from "@/features/products/product.model";
import {
  productFormSchema,
  type ProductFormInput,
} from "@/features/products/product.schema";
import { getCurrentRates } from "@/features/metal-rates/metal-rate.actions";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { CollectionModel } from "@/features/collections/collection.model";
import { ReservationModel } from "@/features/reservations/reservation.model";
import { PageViewModel } from "@/features/visitor-analytics/page-view.model";
import { ROUTES } from "@/constants/routes";
import type { ActionResult, PaginatedResult } from "@/types/common";
import type {
  PriceBreakdown,
  Product,
} from "@/features/products/product.types";
import {
  BADGE_LIST_LIMIT,
  NEW_ARRIVAL_WINDOW_DAYS,
  TRENDING_WINDOW_DAYS,
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
  stoneValue?: number;
  certificationCost?: number;
  customCharges?: number;
  priceOverride?: Product["priceOverride"];
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
    stoneValue: doc.stoneValue ?? 0,
    certificationCost: doc.certificationCost ?? 0,
    customCharges: doc.customCharges ?? 0,
    priceOverride: doc.priceOverride ?? { locked: false },
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

export type ProductSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "weight_asc"
  | "weight_desc"
  | "popularity"
  | "most_viewed"
  | "most_reserved";

/** Sort values that can't be pushed down to MongoDB — price is never stored (computed at render time), and view/reservation counts live in separate collections. Both require the bounded in-memory pass below. */
const IN_MEMORY_SORTS = new Set<ProductSort>([
  "price_asc",
  "price_desc",
  "popularity",
  "most_viewed",
  "most_reserved",
]);

export interface ListProductsParams {
  categoryId?: string;
  /** Multi-select — OR'd together. Takes precedence over `categoryId` if both are given. */
  categoryIds?: string[];
  /** Filters to products belonging to this Collection (Collection.productIds). */
  collectionId?: string;
  metalType?: Product["metalType"];
  /** Multi-select — OR'd together. Takes precedence over `metalType` if both are given. */
  metalTypes?: Product["metalType"][];
  /** Case-insensitive match against name/tags — powers the header search. */
  query?: string;
  featuredOnly?: boolean;
  /** e.g. "made_to_order" — powers the homepage's "Online Exclusive" section. */
  availability?: Product["availability"];
  /** Multi-select — OR'd together. Takes precedence over `availability` if both are given. */
  availabilities?: Product["availability"][];
  priceMin?: number;
  priceMax?: number;
  weightMin?: number;
  weightMax?: number;
  /** Created within the last NEW_ARRIVAL_WINDOW_DAYS days. */
  newArrivalOnly?: boolean;
  page?: number;
  pageSize?: number;
  publishedOnly?: boolean;
  sort?: ProductSort;
}

/** Upper bound when a sort/filter forces an in-memory pass (price, view/reservation counts — see below). Fine at boutique-catalogue scale. */
const MAX_SORT_SCAN = 500;

/** Aggregates PageView hit counts for a set of product slugs over the last TRENDING_WINDOW_DAYS days, keyed by slug. Best-effort — an aggregation failure degrades to "no view data" rather than breaking the listing. */
async function getViewCountsBySlug(
  slugs: string[],
): Promise<Map<string, number>> {
  if (slugs.length === 0) return new Map();
  try {
    const since = new Date();
    since.setDate(since.getDate() - TRENDING_WINDOW_DAYS);
    const paths = slugs.map((slug) => `/product/${slug}`);

    const groups: { _id: string; count: number }[] =
      await PageViewModel.aggregate([
        {
          $match: {
            tenantId: DEFAULT_TENANT_ID,
            path: { $in: paths },
            createdAt: { $gte: since },
          },
        },
        { $group: { _id: "$path", count: { $sum: 1 } } },
      ]);

    return new Map(
      groups.map((g) => [g._id.replace("/product/", ""), g.count]),
    );
  } catch {
    return new Map();
  }
}

/** Aggregates reservation counts for a set of product ids over the last TRENDING_WINDOW_DAYS days, keyed by product id string. */
async function getReservedCountsByProductId(
  productIds: string[],
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  try {
    const since = new Date();
    since.setDate(since.getDate() - TRENDING_WINDOW_DAYS);
    const objectIds = productIds.map((id) => new Types.ObjectId(id));

    const groups: { _id: string; count: number }[] =
      await ReservationModel.aggregate([
        {
          $match: {
            tenantId: DEFAULT_TENANT_ID,
            createdAt: { $gte: since },
            "products.productId": { $in: objectIds },
          },
        },
        { $unwind: "$products" },
        { $match: { "products.productId": { $in: objectIds } } },
        { $group: { _id: "$products.productId", count: { $sum: 1 } } },
      ]);

    return new Map(groups.map((g) => [String(g._id), g.count]));
  } catch {
    return new Map();
  }
}

/**
 * Catalogue-wide "Best Seller" set — top products by reservation count over
 * the last TRENDING_WINDOW_DAYS days, restricted to currently published
 * products (a product reserved before being unpublished shouldn't still
 * show the badge). Recomputing this on every render would mean an extra
 * aggregation per page load for a signal that doesn't need to be
 * millisecond-fresh, so it's time-cached rather than tag-invalidated.
 */
export const getBestSellerProductIds = unstable_cache(
  async (limit: number = BADGE_LIST_LIMIT): Promise<string[]> => {
    await connectToDatabase();
    try {
      const since = new Date();
      since.setDate(since.getDate() - TRENDING_WINDOW_DAYS);

      const groups: { _id: string; count: number }[] =
        await ReservationModel.aggregate([
          { $match: { tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } } },
          { $unwind: "$products" },
          { $group: { _id: "$products.productId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit * 2 }, // headroom before filtering to published-only
        ]);

      const publishedIds = new Set(
        (
          await ProductModel.find({
            tenantId: DEFAULT_TENANT_ID,
            ...NOT_DELETED_FILTER,
            isPublished: true,
            _id: { $in: groups.map((g) => g._id) },
          })
            .select("_id")
            .lean()
        ).map((d) => String(d._id)),
      );

      return groups
        .map((g) => String(g._id))
        .filter((id) => publishedIds.has(id))
        .slice(0, limit);
    } catch {
      return [];
    }
  },
  ["best-seller-product-ids", DEFAULT_TENANT_ID],
  { revalidate: 900 }, // 15 minutes — a popularity signal, not a live counter
);

/** Catalogue-wide "Trending" set — top products by page-view count over the last TRENDING_WINDOW_DAYS days. Same caching reasoning as getBestSellerProductIds. */
export const getTrendingProductIds = unstable_cache(
  async (limit: number = BADGE_LIST_LIMIT): Promise<string[]> => {
    await connectToDatabase();
    try {
      const since = new Date();
      since.setDate(since.getDate() - TRENDING_WINDOW_DAYS);

      const groups: { _id: string; count: number }[] =
        await PageViewModel.aggregate([
          {
            $match: {
              tenantId: DEFAULT_TENANT_ID,
              path: { $regex: "^/product/" },
              createdAt: { $gte: since },
            },
          },
          { $group: { _id: "$path", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit * 2 },
        ]);

      const slugs = groups.map((g) => g._id.replace("/product/", ""));
      const docs = await ProductModel.find({
        tenantId: DEFAULT_TENANT_ID,
        ...NOT_DELETED_FILTER,
        isPublished: true,
        slug: { $in: slugs },
      })
        .select("_id slug")
        .lean();

      const idBySlug = new Map(docs.map((d) => [d.slug, String(d._id)]));
      return slugs
        .map((slug) => idBySlug.get(slug))
        .filter((id): id is string => !!id)
        .slice(0, limit);
    } catch {
      return [];
    }
  },
  ["trending-product-ids", DEFAULT_TENANT_ID],
  { revalidate: 900 },
);

/** Attaches the live calculated price (PRD §12) to a batch of products in one rate lookup. */
async function attachPrices(products: Product[]): Promise<ProductWithPrice[]> {
  const rates = await getCurrentRates();

  return products.map((product) => {
    const rate = rateForMetalType(product.metalType, rates);
    return {
      product,
      price: calculatePrice({
        netWeightGrams: product.netWeightGrams,
        makingChargeType: product.makingChargeType,
        makingChargeValue: product.makingChargeValue,
        gstPercentage: product.gstPercentage,
        metalRatePerGram: rate?.ratePerGram ?? null,
        rateEffectiveDate: rate?.effectiveDate ?? null,
        stoneValue: product.stoneValue,
        certificationCost: product.certificationCost,
        customCharges: product.customCharges,
        override: product.priceOverride,
      }),
    };
  });
}

export async function listProducts({
  categoryId,
  categoryIds,
  collectionId,
  metalType,
  metalTypes,
  query,
  featuredOnly,
  availability,
  availabilities,
  priceMin,
  priceMax,
  weightMin,
  weightMax,
  newArrivalOnly,
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

  const effectiveCategoryIds = categoryIds?.length ? categoryIds : categoryId ? [categoryId] : undefined;
  if (effectiveCategoryIds) filter.categoryId = { $in: effectiveCategoryIds };

  const effectiveMetalTypes = metalTypes?.length ? metalTypes : metalType ? [metalType] : undefined;
  if (effectiveMetalTypes) filter.metalType = { $in: effectiveMetalTypes };

  const effectiveAvailabilities = availabilities?.length
    ? availabilities
    : availability
      ? [availability]
      : undefined;
  if (effectiveAvailabilities) filter.availability = { $in: effectiveAvailabilities };

  if (featuredOnly) filter.isFeatured = true;
  if (publishedOnly) filter.isPublished = true;

  if (weightMin !== undefined || weightMax !== undefined) {
    const range: Record<string, number> = {};
    if (weightMin !== undefined) range.$gte = weightMin;
    if (weightMax !== undefined) range.$lte = weightMax;
    filter.netWeightGrams = range;
  }

  if (newArrivalOnly) {
    const since = new Date();
    since.setDate(since.getDate() - NEW_ARRIVAL_WINDOW_DAYS);
    filter.createdAt = { $gte: since };
  }

  if (collectionId) {
    const collection = await CollectionModel.findOne({
      tenantId: DEFAULT_TENANT_ID,
      _id: collectionId,
    })
      .select("productIds")
      .lean();
    // An empty/missing collection should yield zero results, not "ignore the filter".
    filter._id = { $in: collection?.productIds ?? [] };
  }

  const trimmedQuery = query?.trim();
  // MongoDB $text search against the compound text index (name/SKU/tags/
  // description), ranked by relevance rather than a plain collection-scan
  // regex match.
  if (trimmedQuery) {
    filter.$text = { $search: trimmedQuery };
  }

  const scoreProjection = trimmedQuery
    ? { score: { $meta: "textScore" } }
    : undefined;

  const hasPriceRange = priceMin !== undefined || priceMax !== undefined;

  // Price and popularity/view/reservation-based sorts can't be pushed down
  // to MongoDB (price is computed at render time, never stored; view/
  // reservation counts live in separate collections) — fetch a bounded
  // window, price + rank it, filter/sort in memory, then paginate. Fine at
  // boutique catalogue scale; revisit if the catalogue ever approaches
  // MAX_SORT_SCAN.
  if (IN_MEMORY_SORTS.has(sort) || hasPriceRange) {
    const docs = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(MAX_SORT_SCAN)
      .lean();

    let priced = await attachPrices(
      docs.map((doc) => toProduct(doc as unknown as ProductDoc)),
    );

    if (hasPriceRange) {
      priced = priced.filter(
        ({ price }) =>
          (priceMin === undefined || price.total >= priceMin) &&
          (priceMax === undefined || price.total <= priceMax),
      );
    }

    if (sort === "price_asc" || sort === "price_desc") {
      priced.sort((a, b) =>
        sort === "price_asc"
          ? a.price.total - b.price.total
          : b.price.total - a.price.total,
      );
    } else if (
      sort === "most_viewed" ||
      sort === "most_reserved" ||
      sort === "popularity"
    ) {
      const productIds = priced.map(({ product }) => product.id);
      const slugs = priced.map(({ product }) => product.slug);
      const [viewCounts, reservedCounts] = await Promise.all([
        sort !== "most_reserved"
          ? getViewCountsBySlug(slugs)
          : Promise.resolve(new Map<string, number>()),
        sort !== "most_viewed"
          ? getReservedCountsByProductId(productIds)
          : Promise.resolve(new Map<string, number>()),
      ]);

      const score = ({ product }: ProductWithPrice) => {
        const views = viewCounts.get(product.slug) ?? 0;
        const reservations = reservedCounts.get(product.id) ?? 0;
        if (sort === "most_viewed") return views;
        if (sort === "most_reserved") return reservations;
        // Popularity: a reservation is a much stronger buying-intent signal
        // than a page view, so it's weighted heavier in the composite score.
        return views + reservations * 3;
      };
      priced.sort((a, b) => score(b) - score(a));
    }

    const total = priced.length;
    const start = (page - 1) * pageSize;
    return {
      items: priced.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  const total = await ProductModel.countDocuments(filter);

  // A search query defaults to relevance ranking (textScore) unless the
  // caller explicitly asked for a specific order; otherwise fall back to
  // newest/weight as requested.
  const mongoSort: Record<string, 1 | -1 | { $meta: "textScore" }> =
    sort === "name_asc"
      ? { "name.en": 1 }
      : sort === "weight_asc"
        ? { netWeightGrams: 1 }
        : sort === "weight_desc"
          ? { netWeightGrams: -1 }
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
  const rate = rateForMetalType(product.metalType, rates);

  const price = calculatePrice({
    netWeightGrams: product.netWeightGrams,
    makingChargeType: product.makingChargeType,
    makingChargeValue: product.makingChargeValue,
    gstPercentage: product.gstPercentage,
    metalRatePerGram: rate?.ratePerGram ?? null,
    rateEffectiveDate: rate?.effectiveDate ?? null,
    stoneValue: product.stoneValue,
    certificationCost: product.certificationCost,
    customCharges: product.customCharges,
    override: product.priceOverride,
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
