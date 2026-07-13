import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ReservationsTable } from "@/components/admin/reservations-table";
import { listReservations } from "@/features/reservations/reservation.actions";
import { safeQuery } from "@/lib/db/safe-query";
import {
  RESERVATION_STATUSES,
  RESERVATION_STATUS_META,
} from "@/constants/reservation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { ReservationStatus } from "@/features/reservations/reservation.types";

interface ReservationsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminReservationsPage({
  searchParams,
}: ReservationsPageProps) {
  const { status: statusParam } = await searchParams;
  const status = RESERVATION_STATUSES.includes(statusParam as ReservationStatus)
    ? (statusParam as ReservationStatus)
    : undefined;

  const result = await safeQuery(
    () => listReservations({ status, pageSize: 100 }),
    { items: [], total: 0, page: 1, pageSize: 100, totalPages: 1 },
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Reservations</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} total request{result.total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <StatusTab href={ROUTES.admin.reservations} active={!status}>
          All
        </StatusTab>
        {RESERVATION_STATUSES.map((s) => (
          <StatusTab
            key={s}
            href={`${ROUTES.admin.reservations}?status=${s}`}
            active={status === s}
          >
            {RESERVATION_STATUS_META[s].label}
          </StatusTab>
        ))}
      </div>

      <ReservationsTable data={result.items} />
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
          "cursor-pointer px-3 py-1.5 text-xs",
          !active && "hover:bg-muted",
        )}
      >
        {children}
      </Badge>
    </Link>
  );
}
