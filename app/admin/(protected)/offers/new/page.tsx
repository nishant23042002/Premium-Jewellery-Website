import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OfferForm } from "@/components/admin/offer-form";
import { ROUTES } from "@/constants/routes";

export default function NewOfferPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Offer"
        breadcrumbs={[
          { label: "Offers", href: ROUTES.admin.offers },
          { label: "New" },
        ]}
      />
      <OfferForm />
    </div>
  );
}
