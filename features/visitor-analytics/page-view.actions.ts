"use server";

import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { PageViewModel } from "@/features/visitor-analytics/page-view.model";
import type { TrendChartDatum } from "@/components/common/trend-chart";

const PERIOD_DAYS = 14;

function detectDevice(userAgent: string): "mobile" | "tablet" | "desktop" {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

/** Collapses a raw `document.referrer` down to a bare domain — same-origin (internal link clicks) and empty values both fold into "Direct" so the breakdown only shows genuine external sources. */
function referrerLabel(rawReferrer: string | undefined, host: string): string {
  if (!rawReferrer) return "Direct";
  try {
    const url = new URL(rawReferrer);
    if (url.hostname === host) return "Direct";
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Direct";
  }
}

/**
 * Records one page view — called from PageViewTracker on every storefront
 * route change. Best-effort and silent (same reasoning as logSearchQuery):
 * a tracking failure should never surface to the visitor or break the page.
 */
export async function logPageView(input: {
  visitorId: string;
  path: string;
  referrer?: string;
}): Promise<void> {
  try {
    await connectToDatabase();
    const headerList = await headers();
    const userAgent = headerList.get("user-agent") ?? "";
    const host = headerList.get("host") ?? "";

    await PageViewModel.create({
      tenantId: DEFAULT_TENANT_ID,
      visitorId: input.visitorId,
      path: input.path,
      referrer: referrerLabel(input.referrer, host),
      device: detectDevice(userAgent),
    });
  } catch {
    // Best-effort — never break the page over an analytics write.
  }
}

export interface VisitorAnalytics {
  pageViewsByDay: TrendChartDatum[];
  uniqueVisitorsByDay: TrendChartDatum[];
  topPages: TrendChartDatum[];
  deviceBreakdown: TrendChartDatum[];
  referrerBreakdown: TrendChartDatum[];
  newVsReturning: TrendChartDatum[];
  totalPageViews: number;
  totalUniqueVisitors: number;
}

/**
 * Page views/unique visitors over the last 14 days, top pages, device mix,
 * referrer sources, and a new-vs-returning split. "Returning" is derived
 * Plausible/Fathom-style: a visitorId counts as returning if it has any
 * event before the period start, not from a session-timeout heuristic.
 */
export async function getVisitorAnalytics(): Promise<VisitorAnalytics> {
  await requirePermission("analytics.view");
  await connectToDatabase();

  const since = new Date();
  since.setDate(since.getDate() - (PERIOD_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const [dailyGroups, topPathGroups, deviceGroups, referrerGroups, periodVisitors] =
    await Promise.all([
      PageViewModel.aggregate([
        { $match: { tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            views: { $sum: 1 },
            visitors: { $addToSet: "$visitorId" },
          },
        },
      ]),
      PageViewModel.aggregate([
        { $match: { tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } } },
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      PageViewModel.aggregate([
        { $match: { tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } } },
        { $group: { _id: "$device", count: { $sum: 1 } } },
      ]),
      PageViewModel.aggregate([
        { $match: { tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } } },
        { $group: { _id: "$referrer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      PageViewModel.aggregate([
        { $match: { tenantId: DEFAULT_TENANT_ID, createdAt: { $gte: since } } },
        { $group: { _id: "$visitorId" } },
      ]),
    ]);

  const dailyByDate = new Map(
    dailyGroups.map(
      (g: { _id: string; views: number; visitors: string[] }) => [
        g._id,
        { views: g.views, visitors: g.visitors.length },
      ],
    ),
  );

  const pageViewsByDay: TrendChartDatum[] = [];
  const uniqueVisitorsByDay: TrendChartDatum[] = [];
  for (let i = 0; i < PERIOD_DAYS; i++) {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    const entry = dailyByDate.get(key);
    pageViewsByDay.push({ label, value: entry?.views ?? 0 });
    uniqueVisitorsByDay.push({ label, value: entry?.visitors ?? 0 });
  }

  const totalPageViews = pageViewsByDay.reduce((sum, d) => sum + d.value, 0);

  const visitorIds: string[] = periodVisitors.map((v: { _id: string }) => v._id);
  const totalUniqueVisitors = visitorIds.length;

  let returningCount = 0;
  if (visitorIds.length > 0) {
    const priorVisitors = await PageViewModel.aggregate([
      {
        $match: {
          tenantId: DEFAULT_TENANT_ID,
          visitorId: { $in: visitorIds },
          createdAt: { $lt: since },
        },
      },
      { $group: { _id: "$visitorId" } },
    ]);
    returningCount = priorVisitors.length;
  }
  const newCount = totalUniqueVisitors - returningCount;

  return {
    pageViewsByDay,
    uniqueVisitorsByDay,
    topPages: topPathGroups.map((g: { _id: string; count: number }) => ({
      label: g._id,
      value: g.count,
    })),
    deviceBreakdown: deviceGroups.map((g: { _id: string; count: number }) => ({
      label: g._id.charAt(0).toUpperCase() + g._id.slice(1),
      value: g.count,
    })),
    referrerBreakdown: referrerGroups.map((g: { _id: string; count: number }) => ({
      label: g._id,
      value: g.count,
    })),
    newVsReturning: [
      { label: "New", value: newCount },
      { label: "Returning", value: returningCount },
    ],
    totalPageViews,
    totalUniqueVisitors,
  };
}
