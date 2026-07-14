import { Eye, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaTrendChart } from "@/components/common/area-trend-chart";
import { DonutChart } from "@/components/common/donut-chart";
import { RankedBarList } from "@/components/common/ranked-bar-list";
import { StatCard } from "@/components/admin/stat-card";
import {
  getAnalyticsSummary,
  getReservationInsights,
  getSearchInsights,
} from "@/features/analytics/analytics.actions";
import { getVisitorAnalytics } from "@/features/visitor-analytics/page-view.actions";
import { safeQuery } from "@/lib/db/safe-query";

const EMPTY_SUMMARY = {
  reservationsByDay: [],
  enquiriesByDay: [],
  reservationsByStatus: [],
  productsByCategory: [],
  rateHistory: [],
};

const EMPTY_INSIGHTS = {
  mostReservedProducts: [],
  mostReservedCategories: [],
  topCollections: [],
};

const EMPTY_VISITOR_ANALYTICS = {
  pageViewsByDay: [],
  uniqueVisitorsByDay: [],
  topPages: [],
  deviceBreakdown: [],
  referrerBreakdown: [],
  newVsReturning: [],
  totalPageViews: 0,
  totalUniqueVisitors: 0,
};

export default async function AdminAnalyticsPage() {
  const [summary, insights, searchInsights, visitors] = await Promise.all([
    safeQuery(() => getAnalyticsSummary(), EMPTY_SUMMARY),
    safeQuery(() => getReservationInsights(), EMPTY_INSIGHTS),
    safeQuery(() => getSearchInsights(), []),
    safeQuery(() => getVisitorAnalytics(), EMPTY_VISITOR_ANALYTICS),
  ]);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Analytics"
        description="How the last two weeks have looked, plus what's been reserved and searched overall."
        breadcrumbs={[{ label: "Analytics" }]}
      />

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        Visitor Traffic (last 14 days)
      </h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Page views"
          value={visitors.totalPageViews.toLocaleString("en-IN")}
          icon={Eye}
        />
        <StatCard
          label="Unique visitors"
          value={visitors.totalUniqueVisitors.toLocaleString("en-IN")}
          icon={Users}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Page Views (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <AreaTrendChart
              data={visitors.pageViewsByDay}
              valueLabel="Page views"
              className="h-56 w-full"
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Unique Visitors (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <AreaTrendChart
              data={visitors.uniqueVisitorsByDay}
              valueLabel="Unique visitors"
              variant="line"
              className="h-56 w-full"
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Most Visited Pages</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <RankedBarList
              data={visitors.topPages}
              emptyLabel="No page views logged yet."
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>New vs Returning Visitors</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {visitors.newVsReturning.every((d) => d.value === 0) ? (
              <p className="text-sm text-muted-foreground">
                No visitor data yet.
              </p>
            ) : (
              <DonutChart data={visitors.newVsReturning} className="h-40 w-40" />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {visitors.deviceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No visitor data yet.
              </p>
            ) : (
              <DonutChart data={visitors.deviceBreakdown} className="h-40 w-40" />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <RankedBarList
              data={visitors.referrerBreakdown}
              emptyLabel="No referrer data yet."
            />
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        Business Activity
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Reservations (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <AreaTrendChart
              data={summary.reservationsByDay}
              valueLabel="Reservations"
              className="h-56 w-full"
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Enquiries (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <AreaTrendChart
              data={summary.enquiriesByDay}
              valueLabel="Enquiries"
              variant="line"
              className="h-56 w-full"
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Reservations by Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {summary.reservationsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reservations yet.
              </p>
            ) : (
              <DonutChart data={summary.reservationsByStatus} className="h-40 w-40" />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <RankedBarList
              data={summary.productsByCategory}
              emptyLabel="No products yet."
            />
          </CardContent>
        </Card>

        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle>Gold Rate History (₹/gram)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {summary.rateHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No rate history yet.
              </p>
            ) : (
              <AreaTrendChart
                data={summary.rateHistory}
                valueLabel="Gold rate"
                variant="line"
                className="h-56 w-full"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Most Reserved Jewellery</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <RankedBarList
              data={insights.mostReservedProducts}
              emptyLabel="No reservations yet."
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Most Reserved Categories</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <RankedBarList
              data={insights.mostReservedCategories}
              emptyLabel="No reservations yet."
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Top Performing Collections</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <RankedBarList
              data={insights.topCollections}
              emptyLabel="No collection has been reserved from yet."
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Most Searched Keywords</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <RankedBarList
              data={searchInsights}
              emptyLabel="No searches logged yet."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
