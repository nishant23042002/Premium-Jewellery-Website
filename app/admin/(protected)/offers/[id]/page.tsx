import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OfferForm } from "@/components/admin/offer-form";
import { getOfferByIdForAdmin } from "@/features/offers/offer.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditOfferPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOfferPage({ params }: EditOfferPageProps) {
  const { id } = await params;
  const offer = await safeQuery(() => getOfferByIdForAdmin(id), null);
  if (!offer) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={offer.title.en}
        breadcrumbs={[
          { label: "Offers", href: ROUTES.admin.offers },
          { label: offer.title.en },
        ]}
      />
      <OfferForm offer={offer} />
    </div>
  );
}
