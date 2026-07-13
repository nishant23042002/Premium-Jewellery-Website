import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";
import { getHeroSlideByIdForAdmin } from "@/features/hero-slides/hero-slide.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditHeroSlidePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHeroSlidePage({
  params,
}: EditHeroSlidePageProps) {
  const { id } = await params;
  const slide = await safeQuery(() => getHeroSlideByIdForAdmin(id), null);
  if (!slide) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Edit Hero Slide"
        breadcrumbs={[
          { label: "Hero Slides", href: ROUTES.admin.heroSlides },
          { label: "Edit" },
        ]}
      />
      <HeroSlideForm slide={slide} />
    </div>
  );
}
