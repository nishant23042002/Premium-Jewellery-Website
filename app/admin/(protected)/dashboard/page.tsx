import Link from "next/link";
import {
  CalendarClock,
  Coins,
  MessageSquare,
  Newspaper,
  Package,
  Plus,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listReservations } from "@/features/reservations/reservation.actions";
import { listEnquiries } from "@/features/enquiries/enquiry.actions";
import { getCurrentRates } from "@/features/metal-rates/metal-rate.actions";
import { listProductsForAdmin } from "@/features/products/product.actions";
import { listBlogPosts } from "@/features/blog/blog-post.actions";
import { listAuditLogs } from "@/features/audit-logs/audit-log.actions";
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
  ] = await Promise.all([
    safeQuery(() => listReservations({ status: "pending", pageSize: 1 }), {
      items: [],
      total: 0,
      page: 1,
      pageSize: 1,
      totalPages: 1,
    }),
    safeQuery(() => listEnquiries("new"), []),
    safeQuery(() => getCurrentRates(), { gold: null, silver: null }),
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
  ]);

  return (
    <div className="mx-auto max-w-(--container-wide)">
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
        />
        <StatCard
          label="New enquiries"
          value={newEnquiries.length}
          icon={MessageSquare}
          href={`${ROUTES.admin.enquiries}?status=new`}
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/30 ring-1 ring-gold/10">
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Coins className="size-4 text-gold" />
                Today&apos;s Rate
              </p>
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
            <p className="text-sm font-medium">Quick Actions</p>
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
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border/60">
        <CardContent className="pt-2">
          <p className="mb-3 text-sm font-medium">Recent Activity</p>
          {recentActivity.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing recorded yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentActivity.items.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    <span className="font-medium">{entry.actorEmail}</span>{" "}
                    <Badge variant="outline" className="mx-1 capitalize">
                      {entry.action.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-muted-foreground capitalize">
                      {entry.resource.replace(/_/g, " ")}
                      {entry.resourceLabel && ` — ${entry.resourceLabel}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
