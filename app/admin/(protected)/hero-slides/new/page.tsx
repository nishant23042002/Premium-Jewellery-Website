import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";
import { ROUTES } from "@/constants/routes";

export default function AdminHeroSlideNewPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Add Hero Slide"
        breadcrumbs={[
          { label: "Hero Slides", href: ROUTES.admin.heroSlides },
          { label: "New" },
        ]}
      />
      <HeroSlideForm />
    </div>
  );
}
