import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EnquiriesTable } from "@/components/admin/enquiries-table";
import { listEnquiries } from "@/features/enquiries/enquiry.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { EnquiryStatus } from "@/features/enquiries/enquiry.types";

const STATUSES: EnquiryStatus[] = ["new", "contacted", "closed"];

interface AdminEnquiriesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminEnquiriesPage({
  searchParams,
}: AdminEnquiriesPageProps) {
  const { status: statusParam } = await searchParams;
  const status = STATUSES.includes(statusParam as EnquiryStatus)
    ? (statusParam as EnquiryStatus)
    : undefined;

  const enquiries = await safeQuery(() => listEnquiries(status), []);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Enquiries"
        description={`${enquiries.length} enquir${enquiries.length === 1 ? "y" : "ies"}`}
        breadcrumbs={[{ label: "Enquiries" }]}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <StatusTab href={ROUTES.admin.enquiries} active={!status}>
          All
        </StatusTab>
        {STATUSES.map((s) => (
          <StatusTab
            key={s}
            href={`${ROUTES.admin.enquiries}?status=${s}`}
            active={status === s}
          >
            {s}
          </StatusTab>
        ))}
      </div>

      <EnquiriesTable data={enquiries} />
    </div>
  );
}

function StatusTab({
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
