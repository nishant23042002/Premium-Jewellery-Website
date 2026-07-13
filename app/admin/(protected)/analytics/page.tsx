import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/common/trend-chart";
import { getAnalyticsSummary } from "@/features/analytics/analytics.actions";
import { safeQuery } from "@/lib/db/safe-query";

const EMPTY_SUMMARY = {
  reservationsByDay: [],
  enquiriesByDay: [],
  reservationsByStatus: [],
  productsByCategory: [],
  rateHistory: [],
};

export default async function AdminAnalyticsPage() {
  const summary = await safeQuery(() => getAnalyticsSummary(), EMPTY_SUMMARY);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Analytics"
        description="How the last two weeks have looked, at a glance."
        breadcrumbs={[{ label: "Analytics" }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Reservations (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <TrendChart
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
            <TrendChart
              data={summary.enquiriesByDay}
              valueLabel="Enquiries"
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
              <TrendChart
                data={summary.reservationsByStatus}
                valueLabel="Count"
                className="h-56 w-full"
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {summary.productsByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products yet.</p>
            ) : (
              <TrendChart
                data={summary.productsByCategory}
                valueLabel="Products"
                className="h-56 w-full"
              />
            )}
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
              <TrendChart
                data={summary.rateHistory}
                valueLabel="Gold rate"
                className="h-56 w-full"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
