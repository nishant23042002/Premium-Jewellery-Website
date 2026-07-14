import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Coins,
  FileEdit,
  MessageSquare,
  Newspaper,
  Package,
  PackagePlus,
  Plus,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import { GrowthBadge } from "@/components/admin/growth-badge";
import { RecentActivityFeed } from "@/components/admin/recent-activity-feed";
import { RankedBarList } from "@/components/common/ranked-bar-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listReservations } from "@/features/reservations/reservation.actions";
import { listEnquiries } from "@/features/enquiries/enquiry.actions";
import { getCurrentRates } from "@/features/metal-rates/metal-rate.actions";
import { listProductsForAdmin } from "@/features/products/product.actions";
import { listBlogPosts } from "@/features/blog/blog-post.actions";
import { listAuditLogs } from "@/features/audit-logs/audit-log.actions";
import {
  getExecutiveSummary,
  getInventoryIntelligence,
  getOfferAlerts,
  getSalesIntelligence,
  getSearchInsights,
  getUpcomingAppointments,
} from "@/features/analytics/analytics.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { formatDate, formatINR } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";

export default async function AdminDashboardPage() {
  const [
    pendingReservations,
    newEnquiries,
    rates,
    products,
    blogPosts,
    recentActivity,
    executiveSummary,
    inventory,
    upcomingAppointments,
    offerAlerts,
    salesIntelligence,
    searchInsights,
  ] = await Promise.all([
    safeQuery(() => listReservations({ status: "pending", pageSize: 1 }), {
      items: [],
      total: 0,
      page: 1,
      pageSize: 1,
      totalPages: 1,
    }),
    safeQuery(() => listEnquiries("new"), []),
    safeQuery(() => getCurrentRates(), { gold: null, silver: null, platinum: null }),
    safeQuery(() => listProductsForAdmin({ pageSize: 1 }), {
      items: [],
      total: 0,
      page: 1,
      pageSize: 1,
      totalPages: 1,
    }),
    safeQuery(() => listBlogPosts({ publishedOnly: true }), []),
    safeQuery(() => listAuditLogs({ pageSize: 8 }), {
      items: [],
      total: 0,
      page: 1,
      pageSize: 8,
      totalPages: 1,
    }),
    safeQuery(() => getExecutiveSummary(), {
      reservations: { today: 0, thisWeek: 0, thisMonth: 0, yearToDate: 0, weekGrowthPercent: null },
      enquiries: { today: 0, thisWeek: 0, thisMonth: 0, yearToDate: 0, weekGrowthPercent: null },
    }),
    safeQuery(() => getInventoryIntelligence(), {
      lowStock: [],
      recentlyAdded: [],
      draftCount: 0,
    }),
    safeQuery(() => getUpcomingAppointments(), []),
    safeQuery(() => getOfferAlerts(), []),
    safeQuery(() => getSalesIntelligence(), {
      potentialRevenue: 0,
      averageJewelleryPrice: 0,
      averageReservationValue: 0,
      reservationSampleSize: 0,
      ratePending: true,
    }),
    safeQuery(() => getSearchInsights(), []),
  ]);

  return (
    <div className="mx-auto max-w-(--container-wide) space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Everything worth knowing at a glance."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending reservations"
          value={pendingReservations.total}
          icon={CalendarClock}
          href={`${ROUTES.admin.reservations}?status=pending`}
          accent
          badge={
            <GrowthBadge percent={executiveSummary.reservations.weekGrowthPercent} />
          }
        />
        <StatCard
          label="New enquiries"
          value={newEnquiries.length}
          icon={MessageSquare}
          href={`${ROUTES.admin.enquiries}?status=new`}
          badge={
            <GrowthBadge percent={executiveSummary.enquiries.weekGrowthPercent} />
          }
        />
        <StatCard
          label="Products"
          value={products.total}
          icon={Package}
          href={ROUTES.admin.products}
        />
        <StatCard
          label="Published posts"
          value={blogPosts.length}
          icon={Newspaper}
          href={ROUTES.admin.blog}
        />
      </div>

      {/* ---------- Business pulse ---------- */}
      <Card className="border-border/60">
        <CardContent className="pt-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="size-4 text-gold" />
            Business Pulse
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {(
              [
                { label: "Reservations", data: executiveSummary.reservations, href: ROUTES.admin.reservations },
                { label: "Enquiries", data: executiveSummary.enquiries, href: ROUTES.admin.enquiries },
              ] as const
            ).map((entity) => (
              <div key={entity.label}>
                <Link
                  href={entity.href}
                  className="text-sm font-medium hover:text-gold-dark"
                >
                  {entity.label}
                </Link>
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold tabular-nums">
                      {entity.data.today}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground">Today</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-lg font-semibold tabular-nums">
                        {entity.data.thisWeek}
                      </p>
                    </div>
                    <p className="text-[0.65rem] text-muted-foreground">
                      This Week
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums">
                      {entity.data.thisMonth}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground">
                      This Month
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums">
                      {entity.data.yearToDate}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground">YTD</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-center">
                  <GrowthBadge percent={entity.data.weekGrowthPercent} />
                  <span className="ml-1.5 text-[0.65rem] text-muted-foreground">
                    vs. last week
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/30 ring-1 ring-gold/10">
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <Coins className="size-4 text-gold" />
                Today&apos;s Rate
              </h2>
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={ROUTES.admin.rates} />}
              >
                Update
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Gold (22K)</p>
                <p className="font-medium">
                  {rates.gold
                    ? `${formatINR(rates.gold.ratePerGram)}/g`
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Silver (999)</p>
                <p className="font-medium">
                  {rates.silver
                    ? `${formatINR(rates.silver.ratePerGram)}/g`
                    : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-3 pt-2">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-gold" />
              Sales Intelligence
            </h2>
            {salesIntelligence.ratePending ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Set today&apos;s metal rate to see estimated values.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Potential inventory value
                  </p>
                  <p className="font-medium">
                    {formatINR(salesIntelligence.potentialRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. piece price</p>
                  <p className="font-medium">
                    {formatINR(salesIntelligence.averageJewelleryPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Avg. reservation value
                  </p>
                  <p className="font-medium">
                    {salesIntelligence.reservationSampleSize > 0
                      ? formatINR(salesIntelligence.averageReservationValue)
                      : "—"}
                  </p>
                </div>
              </div>
            )}
            <p className="border-t border-border/60 pt-2 text-[0.65rem] text-muted-foreground">
              Estimates at today&apos;s rate — there&apos;s no online checkout
              yet, so this isn&apos;t a sales record.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="space-y-3 pt-2">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="size-4 text-warning" />
              Low Stock
              {inventory.lowStock.length > 0 && (
                <Badge variant="outline" className="h-5 w-auto px-2 text-[0.65rem]">
                  {inventory.lowStock.length}
                </Badge>
              )}
            </h2>
            {inventory.lowStock.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nothing running low right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {inventory.lowStock.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={ROUTES.admin.product(p.id)}
                      className="flex items-center justify-between gap-2 text-sm hover:text-gold-dark"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {p.quantity} left
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {inventory.draftCount > 0 && (
              <p className="border-t border-border/60 pt-2 text-xs text-muted-foreground">
                <FileEdit className="mr-1 inline size-3" />
                {inventory.draftCount} draft product
                {inventory.draftCount === 1 ? "" : "s"} not yet published.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-3 pt-2">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="size-4 text-gold" />
              Upcoming Appointments
            </h2>
            {upcomingAppointments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No appointments booked yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingAppointments.map((a) => (
                  <li key={a.id} className="text-sm">
                    <Link
                      href={ROUTES.admin.reservation(a.id)}
                      className="flex items-center justify-between gap-2 hover:text-gold-dark"
                    >
                      <span className="truncate">{a.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(a.preferredDate)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-3 pt-2">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Tag className="size-4 text-gold" />
              Offers Expiring Soon
            </h2>
            {offerAlerts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nothing expiring in the next two weeks.
              </p>
            ) : (
              <ul className="space-y-2">
                {offerAlerts.map((o) => (
                  <li key={o.id} className="text-sm">
                    <Link
                      href={ROUTES.admin.offer(o.id)}
                      className="flex items-center justify-between gap-2 hover:text-gold-dark"
                    >
                      <span className="truncate">{o.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {o.daysLeft === 0 ? "Today" : `${o.daysLeft}d left`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="space-y-3 pt-2">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Search className="size-4 text-gold" />
              Most Searched
            </h2>
            <RankedBarList
              data={searchInsights}
              emptyLabel="No searches logged yet."
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-3 pt-2">
            <h2 className="text-sm font-medium">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={ROUTES.admin.productNew} />}
              >
                <Plus className="size-3.5" />
                New Product
              </Button>
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={ROUTES.admin.blogNew} />}
              >
                <Plus className="size-3.5" />
                New Post
              </Button>
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={ROUTES.admin.offerNew} />}
              >
                <Plus className="size-3.5" />
                New Offer
              </Button>
              {inventory.recentlyAdded[0] && (
                <Button
                  size="sm"
                  variant="ghost"
                  nativeButton={false}
                  render={
                    <Link href={ROUTES.admin.product(inventory.recentlyAdded[0].id)} />
                  }
                >
                  <PackagePlus className="size-3.5" />
                  Latest: {inventory.recentlyAdded[0].name}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-2">
          <h2 className="mb-1 text-sm font-medium">Recent Activity</h2>
          <RecentActivityFeed entries={recentActivity.items} />
        </CardContent>
      </Card>
    </div>
  );
}
