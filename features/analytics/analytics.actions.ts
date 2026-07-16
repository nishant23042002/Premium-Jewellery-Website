"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { calculatePrice, rateForMetalType } from "@/lib/pricing/calculate-price";
import { ReservationModel } from "@/features/reservations/reservation.model";
import { EnquiryModel } from "@/features/enquiries/enquiry.model";
import { ProductModel } from "@/features/products/product.model";
import { CategoryModel } from "@/features/categories/category.model";
import { CollectionModel } from "@/features/collections/collection.model";
import { OfferModel } from "@/features/offers/offer.model";
import { MetalRateModel } from "@/features/metal-rates/metal-rate.model";
import { getCurrentRates } from "@/features/metal-rates/metal-rate.actions";
import {
  getPopularSearches,
  getZeroResultSearches,
} from "@/features/search-analytics/search-query.actions";
import { PageViewModel } from "@/features/visitor-analytics/page-view.model";
import { LOW_STOCK_THRESHOLD } from "@/features/products/product.types";
import { ROUTES } from "@/constants/routes";
import type { TrendChartDatum } from "@/components/common/trend-chart";
import type { RankedImageDatum } from "@/components/common/ranked-image-list";
import type { PopularSearch } from "@/features/search-analytics/search-query.actions";

async function countsByDay(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  days: number,
): Promise<TrendChartDatum[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const results: { _id: string; count: number }[] = await model.aggregate([
    { $match: { tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const countByDate = new Map(results.map((r) => [r._id, r.count]));
  const out: TrendChartDatum[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    out.push({
      label: day.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      value: countByDate.get(key) ?? 0,
    });
  }
  return out;
}

export interface AnalyticsSummary {
  reservationsByDay: TrendChartDatum[];
  enquiriesByDay: TrendChartDatum[];
  reservationsByStatus: TrendChartDatum[];
  productsByCategory: RankedImageDatum[];
  rateHistory: TrendChartDatum[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  await requirePermission("analytics.view");
  await connectToDatabase();

  const [
    reservationsByDay,
    enquiriesByDay,
    statusGroups,
    categoryGroups,
    categories,
    goldRates,
  ] = await Promise.all([
    countsByDay(ReservationModel, 14),
    countsByDay(EnquiryModel, 14),
    ReservationModel.aggregate([
      { $match: { tenantId: DEFAULT_TENANT_ID } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ProductModel.aggregate([
      { $match: { tenantId: DEFAULT_TENANT_ID, deletedAt: null } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
    CategoryModel.find({ tenantId: DEFAULT_TENANT_ID }).lean(),
    MetalRateModel.find({ tenantId: DEFAULT_TENANT_ID, metalType: "gold" })
      .sort({ effectiveDate: -1 })
      .limit(14)
      .lean(),
  ]);

  const categoryById = new Map(categories.map((c) => [String(c._id), c]));

  return {
    reservationsByDay,
    enquiriesByDay,
    reservationsByStatus: statusGroups.map(
      (g: { _id: string; count: number }) => ({
        label: g._id,
        value: g.count,
      }),
    ),
    productsByCategory: categoryGroups
      .map((g: { _id: unknown; count: number }) => {
        const category = categoryById.get(String(g._id));
        return {
          id: category ? String(category._id) : undefined,
          label: category?.name.en ?? "Uncategorized",
          value: g.count,
          imageUrl: category?.imageUrl ?? undefined,
          href: category ? ROUTES.admin.category(String(category._id)) : undefined,
        };
      })
      .sort((a, b) => b.value - a.value),
    rateHistory: [...goldRates].reverse().map((r) => ({
      label: r.effectiveDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      value: r.ratePerGram,
    })),
  };
}

// ---------------------------------------------------------------------------
// Category B: read-only rollups over already-stored data (no new tracking,
// no schema changes) — powers the redesigned Dashboard/Analytics pages.
// ---------------------------------------------------------------------------

export interface PeriodMetrics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  yearToDate: number;
  /** null when there's no prior-week data to compare against. */
  weekGrowthPercent: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function periodMetrics(model: any): Promise<PeriodMetrics> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfPrevWeek = new Date(startOfWeek);
  startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [today, thisWeek, prevWeek, thisMonth, yearToDate] =
    await Promise.all([
      model.countDocuments({
        tenantId: DEFAULT_TENANT_ID,
        createdAt: { $gte: startOfToday },
      }),
      model.countDocuments({
        tenantId: DEFAULT_TENANT_ID,
        createdAt: { $gte: startOfWeek },
      }),
      model.countDocuments({
        tenantId: DEFAULT_TENANT_ID,
        createdAt: { $gte: startOfPrevWeek, $lt: startOfWeek },
      }),
      model.countDocuments({
        tenantId: DEFAULT_TENANT_ID,
        createdAt: { $gte: startOfMonth },
      }),
      model.countDocuments({
        tenantId: DEFAULT_TENANT_ID,
        createdAt: { $gte: startOfYear },
      }),
    ]);

  const weekGrowthPercent =
    prevWeek === 0 ? null : Math.round(((thisWeek - prevWeek) / prevWeek) * 100);

  return { today, thisWeek, thisMonth, yearToDate, weekGrowthPercent };
}

export interface ExecutiveSummary {
  reservations: PeriodMetrics;
  enquiries: PeriodMetrics;
}

/** Today/this-week/this-month/YTD counts + week-over-week growth for reservations and enquiries. */
export async function getExecutiveSummary(): Promise<ExecutiveSummary> {
  await requirePermission("dashboard.view");
  await connectToDatabase();

  const [reservations, enquiries] = await Promise.all([
    periodMetrics(ReservationModel),
    periodMetrics(EnquiryModel),
  ]);

  return { reservations, enquiries };
}

export interface InventoryIntelligence {
  lowStock: { id: string; name: string; slug: string; quantity: number }[];
  recentlyAdded: { id: string; name: string; slug: string; createdAt: string }[];
  draftCount: number;
}

/** Low-stock list, most recently added products, and a count of unpublished drafts — all existing product fields, just filtered/sorted differently. */
export async function getInventoryIntelligence(): Promise<InventoryIntelligence> {
  await requirePermission("dashboard.view");
  await connectToDatabase();

  const [lowStockDocs, recentDocs, draftCount] = await Promise.all([
    ProductModel.find({
      tenantId: DEFAULT_TENANT_ID,
      ...NOT_DELETED_FILTER,
      isPublished: true,
      quantity: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
    })
      .sort({ quantity: 1 })
      .limit(5)
      .select("name slug quantity")
      .lean(),
    ProductModel.find({ tenantId: DEFAULT_TENANT_ID, ...NOT_DELETED_FILTER })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name slug createdAt")
      .lean(),
    ProductModel.countDocuments({
      tenantId: DEFAULT_TENANT_ID,
      ...NOT_DELETED_FILTER,
      isPublished: false,
    }),
  ]);

  return {
    lowStock: lowStockDocs.map((d) => ({
      id: String(d._id),
      name: d.name.en,
      slug: d.slug,
      quantity: d.quantity ?? 0,
    })),
    recentlyAdded: recentDocs.map((d) => ({
      id: String(d._id),
      name: d.name.en,
      slug: d.slug,
      createdAt: d.createdAt.toISOString(),
    })),
    draftCount,
  };
}

export interface UpcomingAppointment {
  id: string;
  name: string;
  phone: string;
  preferredDate: string;
  preferredTimeSlot: string;
  status: string;
}

/** Next N reservations by preferred date — same fields already on the reservation model. */
export async function getUpcomingAppointments(
  limit = 5,
): Promise<UpcomingAppointment[]> {
  await requirePermission("dashboard.view");
  await connectToDatabase();

  const docs = await ReservationModel.find({
    tenantId: DEFAULT_TENANT_ID,
    preferredDate: { $gte: new Date() },
    status: { $in: ["pending", "confirmed"] },
  })
    .sort({ preferredDate: 1 })
    .limit(limit)
    .lean();

  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    phone: d.phone,
    preferredDate: d.preferredDate.toISOString(),
    preferredTimeSlot: d.preferredTimeSlot,
    status: d.status ?? "pending",
  }));
}

export interface OfferAlert {
  id: string;
  title: string;
  validUntil: string;
  daysLeft: number;
}

/** Published offers expiring within the next N days — existing `validUntil` field, just a date-range filter. */
export async function getOfferAlerts(withinDays = 14): Promise<OfferAlert[]> {
  await requirePermission("dashboard.view");
  await connectToDatabase();

  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + withinDays);

  const docs = await OfferModel.find({
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
    isPublished: true,
    validUntil: { $gte: now, $lte: until },
  })
    .sort({ validUntil: 1 })
    .lean();

  return docs.map((d) => ({
    id: String(d._id),
    title: d.title.en,
    validUntil: d.validUntil.toISOString(),
    daysLeft: Math.ceil((d.validUntil.getTime() - now.getTime()) / 86_400_000),
  }));
}

export interface SalesIntelligence {
  /** Sum of today's calculated price across every published, in-stock product — a ceiling, not a forecast. */
  potentialRevenue: number;
  averageJewelleryPrice: number;
  /** Average current value of the products attached to reservations from the last 90 days. */
  averageReservationValue: number;
  reservationSampleSize: number;
  /** True if no metal rate has been entered yet — the totals above are 0 until then. */
  ratePending: boolean;
}

interface PricingFields {
  metalType: "gold" | "silver" | "platinum" | "diamond" | "other";
  netWeightGrams: number;
  makingChargeType: "percentage" | "per_gram" | "flat";
  makingChargeValue: number;
  gstPercentage: number;
}

function priceOf(
  product: PricingFields,
  rates: Awaited<ReturnType<typeof getCurrentRates>>,
) {
  const rate = rateForMetalType(product.metalType, rates);
  return calculatePrice({
    netWeightGrams: product.netWeightGrams,
    makingChargeType: product.makingChargeType,
    makingChargeValue: product.makingChargeValue,
    gstPercentage: product.gstPercentage,
    metalRatePerGram: rate?.ratePerGram ?? null,
    rateEffectiveDate: rate?.effectiveDate ?? null,
  });
}

/**
 * "Future-ready" sales metrics reusing the same pricing engine that already
 * prices every product for the storefront — since there's no online
 * ordering yet, this is a same-day estimate, not a sales record.
 */
export async function getSalesIntelligence(): Promise<SalesIntelligence> {
  await requirePermission("dashboard.view");
  await connectToDatabase();

  const [inStockProducts, rates] = await Promise.all([
    ProductModel.find({
      tenantId: DEFAULT_TENANT_ID,
      ...NOT_DELETED_FILTER,
      isPublished: true,
      quantity: { $gt: 0 },
    })
      .select(
        "metalType netWeightGrams makingChargeType makingChargeValue gstPercentage",
      )
      .lean(),
    getCurrentRates(),
  ]);

  let potentialRevenue = 0;
  let ratePending = false;
  for (const product of inStockProducts) {
    const price = priceOf(product, rates);
    if (price.isRatePending) ratePending = true;
    potentialRevenue += price.total;
  }
  const averageJewelleryPrice =
    inStockProducts.length > 0 ? potentialRevenue / inStockProducts.length : 0;

  const since = new Date();
  since.setDate(since.getDate() - 90);
  const recentReservations = await ReservationModel.find({
    tenantId: DEFAULT_TENANT_ID,
    createdAt: { $gte: since },
  })
    .select("products")
    .lean();

  const reservedProductIds = Array.from(
    new Set(
      recentReservations.flatMap((r) =>
        r.products.map((p) => String(p.productId)),
      ),
    ),
  );

  const priceById = new Map<string, number>();
  if (reservedProductIds.length > 0) {
    const priceLookupProducts = await ProductModel.find({
      _id: { $in: reservedProductIds },
      tenantId: DEFAULT_TENANT_ID,
    })
      .select(
        "metalType netWeightGrams makingChargeType makingChargeValue gstPercentage",
      )
      .lean();
    for (const product of priceLookupProducts) {
      priceById.set(String(product._id), priceOf(product, rates).total);
    }
  }

  let totalReservationValue = 0;
  for (const reservation of recentReservations) {
    for (const product of reservation.products) {
      totalReservationValue += priceById.get(String(product.productId)) ?? 0;
    }
  }
  const averageReservationValue =
    recentReservations.length > 0
      ? totalReservationValue / recentReservations.length
      : 0;

  return {
    potentialRevenue,
    averageJewelleryPrice,
    averageReservationValue,
    reservationSampleSize: recentReservations.length,
    ratePending,
  };
}

export interface ReservationInsights {
  mostReservedProducts: RankedImageDatum[];
  mostReservedCategories: RankedImageDatum[];
  topCollections: RankedImageDatum[];
}

/** Ranks products/categories/collections by how often they appear across all reservations — the reservation model already snapshots product name/slug per line item. Ids/images are resolved alongside (both were already being looked up here to compute the rollups; they just weren't kept on the returned shape before). */
export async function getReservationInsights(): Promise<ReservationInsights> {
  await requirePermission("analytics.view");
  await connectToDatabase();

  const reservations = await ReservationModel.find({
    tenantId: DEFAULT_TENANT_ID,
  })
    .select("products")
    .lean();

  const productCounts = new Map<string, { name: string; count: number }>();
  for (const reservation of reservations) {
    for (const product of reservation.products) {
      const id = String(product.productId);
      const existing = productCounts.get(id);
      if (existing) existing.count += 1;
      else productCounts.set(id, { name: product.name, count: 1 });
    }
  }

  const reservedProductIds = Array.from(productCounts.keys());
  const [productsForCategory, categories, collections] = await Promise.all([
    reservedProductIds.length > 0
      ? ProductModel.find({
          _id: { $in: reservedProductIds },
          tenantId: DEFAULT_TENANT_ID,
        })
          .select("categoryId slug images")
          .lean()
      : Promise.resolve([]),
    CategoryModel.find({ tenantId: DEFAULT_TENANT_ID })
      .select("name imageUrl")
      .lean(),
    CollectionModel.find({
      tenantId: DEFAULT_TENANT_ID,
      ...NOT_DELETED_FILTER,
      isPublished: true,
    })
      .select("name imageUrl productIds")
      .lean(),
  ]);

  const productById = new Map(productsForCategory.map((p) => [String(p._id), p]));
  const categoryById = new Map(categories.map((c) => [String(c._id), c]));

  const mostReservedProducts = Array.from(productCounts.entries())
    .map(([id, { name, count }]) => {
      const product = productById.get(id);
      return {
        id,
        label: name,
        value: count,
        imageUrl: product?.images?.[0]?.url,
        href: product ? ROUTES.admin.product(id) : undefined,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const categoryCounts = new Map<string, number>();
  for (const [productId, { count }] of productCounts) {
    const categoryId = productById.get(productId)?.categoryId;
    if (!categoryId) continue;
    const key = String(categoryId);
    categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + count);
  }
  const mostReservedCategories = Array.from(categoryCounts.entries())
    .map(([id, count]) => {
      const category = categoryById.get(id);
      return {
        id,
        label: category?.name.en ?? "Uncategorized",
        value: count,
        imageUrl: category?.imageUrl ?? undefined,
        href: category ? ROUTES.admin.category(id) : undefined,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topCollections = collections
    .map((c) => ({
      id: String(c._id),
      label: c.name.en,
      value: c.productIds.reduce(
        (sum, pid) => sum + (productCounts.get(String(pid))?.count ?? 0),
        0,
      ),
      imageUrl: c.imageUrl ?? undefined,
      href: ROUTES.admin.collection(String(c._id)),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return { mostReservedProducts, mostReservedCategories, topCollections };
}

/**
 * Most-viewed products over the last 30 days, by storefront page views —
 * the same PageView data that already powers the "Trending" badge, just
 * surfaced with real counts and photos instead of feeding a cached id list.
 * A separate, un-cached read (unlike product.actions.ts's getTrendingProductIds)
 * since the analytics dashboard is an admin reading it a few times a day,
 * not a hot storefront render path.
 */
export async function getMostViewedProducts(limit = 5): Promise<RankedImageDatum[]> {
  await requirePermission("analytics.view");
  await connectToDatabase();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const groups: { _id: string; count: number }[] = await PageViewModel.aggregate([
    {
      $match: {
        tenantId: DEFAULT_TENANT_ID,
        path: { $regex: "^/product/" },
        createdAt: { $gte: since },
      },
    },
    { $group: { _id: "$path", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit * 2 }, // headroom before filtering to still-existing/published products
  ]);
  if (groups.length === 0) return [];

  const slugToCount = new Map(
    groups.map((g) => [g._id.replace("/product/", ""), g.count]),
  );
  const products = await ProductModel.find({
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
    isPublished: true,
    slug: { $in: Array.from(slugToCount.keys()) },
  })
    .select("name slug images")
    .lean();

  return products
    .map((p) => ({
      id: String(p._id),
      label: p.name.en,
      value: slugToCount.get(p.slug) ?? 0,
      imageUrl: p.images?.[0]?.url,
      href: ROUTES.admin.product(String(p._id)),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** Reuses the existing search-query counter — just reshaped for a ranked-list card. */
export async function getSearchInsights(): Promise<TrendChartDatum[]> {
  await requirePermission("analytics.view");
  const popular = await getPopularSearches(6);
  return popular.map((p) => ({ label: p.query, value: p.count }));
}

/**
 * Search terms that consistently return nothing — a direct signal for what
 * to stock or add to the catalogue next ("customers keep searching X, we
 * don't carry X"), which none of the other rollups here can answer since
 * they're all built from what customers already found, not what they
 * couldn't.
 */
export async function getZeroResultSearchInsights(): Promise<TrendChartDatum[]> {
  await requirePermission("analytics.view");
  const zeroResult: PopularSearch[] = await getZeroResultSearches(6);
  return zeroResult.map((p) => ({ label: p.query, value: p.count }));
}
