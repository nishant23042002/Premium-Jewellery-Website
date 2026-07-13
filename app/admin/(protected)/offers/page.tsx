import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OffersTable } from "@/components/admin/offers-table";
import { Button } from "@/components/ui/button";
import { listOffers } from "@/features/offers/offer.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminOffersPage() {
  const offers = await safeQuery(
    () => listOffers({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Offers"
        description={`${offers.length} offer${offers.length === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Offers" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.offerNew} />}
          >
            <Plus className="size-3.5" />
            New Offer
          </Button>
        }
      />
      <OffersTable data={offers} />
    </div>
  );
}
