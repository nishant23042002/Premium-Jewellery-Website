import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerNotesForm } from "@/components/admin/customer-notes-form";
import { getCustomerById } from "@/features/customers/customer.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const result = await safeQuery(() => getCustomerById(id), null);
  if (!result) notFound();

  const { customer, reservations, enquiries } = result;

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        title={customer.name}
        breadcrumbs={[
          { label: "Customers", href: ROUTES.admin.customers },
          { label: customer.name },
        ]}
      />

      <Card className="border-border/60">
        <CardContent className="grid gap-4 pt-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1.5 text-sm font-medium hover:text-gold-dark"
            >
              <Phone className="size-3.5" />
              {customer.phone}
            </a>
          </div>
          {customer.email && (
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <a
                href={`mailto:${customer.email}`}
                className="flex items-center gap-1.5 text-sm font-medium hover:text-gold-dark"
              >
                <Mail className="size-3.5" />
                {customer.email}
              </a>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Last contact</p>
            <p className="text-sm font-medium">
              {formatDate(customer.lastContactAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Activity</p>
            <p className="text-sm font-medium">
              {customer.totalReservations} reservation
              {customer.totalReservations === 1 ? "" : "s"} ·{" "}
              {customer.totalEnquiries} enquir
              {customer.totalEnquiries === 1 ? "y" : "ies"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-border/60">
        <CardContent className="pt-2">
          <p className="mb-3 text-xs text-muted-foreground">Notes & Tags</p>
          <CustomerNotesForm
            customerId={customer.id}
            initialNotes={customer.notes}
            initialTags={customer.tags}
          />
        </CardContent>
      </Card>

      {reservations.length > 0 && (
        <Card className="mt-4 border-border/60">
          <CardContent className="pt-2">
            <p className="mb-2 text-xs text-muted-foreground">Reservations</p>
            <ul className="space-y-2">
              {reservations.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-sm"
                >
                  <Link
                    href={ROUTES.admin.reservation(r.id)}
                    className="hover:text-gold-dark"
                  >
                    Visit on {formatDate(r.preferredDate)}
                  </Link>
                  <Badge variant="outline" className="capitalize">
                    {r.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {enquiries.length > 0 && (
        <Card className="mt-4 border-border/60">
          <CardContent className="pt-2">
            <p className="mb-2 text-xs text-muted-foreground">Enquiries</p>
            <ul className="space-y-2">
              {enquiries.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate pr-4">
                    {e.message || "No message"}
                  </span>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {e.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
