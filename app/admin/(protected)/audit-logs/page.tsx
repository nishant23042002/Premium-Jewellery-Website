import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AuditLogsTable } from "@/components/admin/audit-logs-table";
import {
  listAuditLogs,
  listAuditResources,
} from "@/features/audit-logs/audit-log.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface AdminAuditLogsPageProps {
  searchParams: Promise<{ resource?: string }>;
}

export default async function AdminAuditLogsPage({
  searchParams,
}: AdminAuditLogsPageProps) {
  const { resource } = await searchParams;

  const [result, resources] = await Promise.all([
    safeQuery(() => listAuditLogs({ resource, pageSize: 100 }), {
      items: [],
      total: 0,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    }),
    safeQuery(() => listAuditResources(), []),
  ]);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Audit Logs"
        description={`${result.total} recorded action${result.total === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Audit Logs" }]}
      />

      {resources.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterTab href={ROUTES.admin.auditLogs} active={!resource}>
            All
          </FilterTab>
          {resources.map((r) => (
            <FilterTab
              key={r}
              href={`${ROUTES.admin.auditLogs}?resource=${r}`}
              active={resource === r}
            >
              {r.replace(/_/g, " ")}
            </FilterTab>
          ))}
        </div>
      )}

      <AuditLogsTable data={result.items} />
    </div>
  );
}

function FilterTab({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Badge
        variant={active ? "gold" : "outline"}
        className={cn(
          "cursor-pointer px-3 py-1.5 text-xs capitalize",
          !active && "hover:bg-muted",
        )}
      >
        {children}
      </Badge>
    </Link>
  );
}
