"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { ReservationModel } from "@/features/reservations/reservation.model";
import { EnquiryModel } from "@/features/enquiries/enquiry.model";
import { ProductModel } from "@/features/products/product.model";
import { CategoryModel } from "@/features/categories/category.model";
import { MetalRateModel } from "@/features/metal-rates/metal-rate.model";
import type { TrendChartDatum } from "@/components/common/trend-chart";

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
  productsByCategory: TrendChartDatum[];
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

  const categoryNameById = new Map(
    categories.map((c) => [String(c._id), c.name.en]),
  );

  return {
    reservationsByDay,
    enquiriesByDay,
    reservationsByStatus: statusGroups.map(
      (g: { _id: string; count: number }) => ({
        label: g._id,
        value: g.count,
      }),
    ),
    productsByCategory: categoryGroups.map(
      (g: { _id: unknown; count: number }) => ({
        label: categoryNameById.get(String(g._id)) ?? "Uncategorized",
        value: g.count,
      }),
    ),
    rateHistory: [...goldRates].reverse().map((r) => ({
      label: r.effectiveDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      value: r.ratePerGram,
    })),
  };
}
