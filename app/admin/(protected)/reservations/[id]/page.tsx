import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReservationStatusActions } from "@/components/admin/reservation-status-actions";
import { ReservationNoteForm } from "@/components/admin/reservation-note-form";
import { getReservationById } from "@/features/reservations/reservation.actions";
import {
  buildWhatsAppLink,
  reservationConfirmedCustomerMessage,
  reservationReceivedCustomerMessage,
} from "@/lib/notifications/whatsapp-templates";
import { BRANCHES } from "@/constants/branches";
import { RESERVATION_STATUS_META } from "@/constants/reservation";
import { ROUTES } from "@/constants/routes";
import { formatDate } from "@/lib/utils/format";

interface ReservationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminReservationDetailPage({
  params,
}: ReservationDetailPageProps) {
  const { id } = await params;
  const reservation = await getReservationById(id);

  if (!reservation) notFound();

  const branch = BRANCHES.find((b) => b.id === reservation.branchId);
  const statusMeta = RESERVATION_STATUS_META[reservation.status];
  const whatsappMessage =
    reservation.status === "confirmed"
      ? reservationConfirmedCustomerMessage(reservation)
      : reservationReceivedCustomerMessage(reservation);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={ROUTES.admin.reservations}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        All Reservations
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl">{reservation.name}</h1>
          <p className="text-sm text-muted-foreground">
            Submitted {formatDate(reservation.createdAt)}
          </p>
        </div>
        <Badge variant={statusMeta.badgeVariant} className="text-sm">
          {statusMeta.label}
        </Badge>
      </div>

      <ReservationStatusActions reservation={reservation} />

      <Card className="mt-6 border-border/60">
        <CardContent className="grid gap-4 pt-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Preferred Visit</p>
            <p className="text-sm font-medium">
              {formatDate(reservation.preferredDate)} ·{" "}
              {reservation.preferredTimeSlot}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Branch</p>
            <p className="text-sm font-medium">
              {branch?.name ?? reservation.branchId}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <a
              href={`tel:${reservation.phone}`}
              className="flex items-center gap-1.5 text-sm font-medium hover:text-gold-dark"
            >
              <Phone className="size-3.5" />
              {reservation.phone}
            </a>
          </div>
          {reservation.email && (
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <a
                href={`mailto:${reservation.email}`}
                className="flex items-center gap-1.5 text-sm font-medium hover:text-gold-dark"
              >
                <Mail className="size-3.5" />
                {reservation.email}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {reservation.products.length > 0 && (
        <Card className="mt-4 border-border/60">
          <CardContent className="pt-2">
            <p className="mb-2 text-xs text-muted-foreground">
              Pieces Requested
            </p>
            <ul className="space-y-1">
              {reservation.products.map((p) => (
                <li key={p.productId}>
                  <Link
                    href={ROUTES.product(p.slug)}
                    className="text-sm text-gold-dark hover:underline"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {reservation.message && (
        <Card className="mt-4 border-border/60">
          <CardContent className="pt-2">
            <p className="mb-1 text-xs text-muted-foreground">
              Customer Message
            </p>
            <p className="text-sm">{reservation.message}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4 border-border/60">
        <CardContent className="pt-2">
          <p className="mb-3 text-xs text-muted-foreground">Quick Contact</p>
          <Button
            variant="outline-gold"
            size="sm"
            nativeButton={false}
            render={
              <a
                href={buildWhatsAppLink(reservation.phone, whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" />
                Message on WhatsApp
              </a>
            }
          />
        </CardContent>
      </Card>

      <Card className="mt-4 border-border/60">
        <CardContent className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">Activity Log</p>
          <ol className="space-y-3">
            {[...reservation.activityLog].reverse().map((entry, i) => (
              <li key={i} className="border-l-2 border-border pl-3 text-sm">
                <p className="font-medium capitalize">{entry.action}</p>
                {entry.note && (
                  <p className="text-muted-foreground">{entry.note}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDate(entry.at)}
                  {entry.byAdminName && ` · ${entry.byAdminName}`}
                </p>
              </li>
            ))}
          </ol>
          <ReservationNoteForm reservationId={reservation.id} />
        </CardContent>
      </Card>
    </div>
  );
}
