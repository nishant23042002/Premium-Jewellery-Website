import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HeroSlidesTable } from "@/components/admin/hero-slides-table";
import { Button } from "@/components/ui/button";
import { listHeroSlides } from "@/features/hero-slides/hero-slide.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminHeroSlidesPage() {
  const slides = await safeQuery(
    () => listHeroSlides({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Hero Slides"
        description={`${slides.length} slide${slides.length === 1 ? "" : "s"} — homepage banner carousel`}
        breadcrumbs={[{ label: "Hero Slides" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.heroSlidesNew} />}
          >
            <Plus className="size-3.5" />
            Add Slide
          </Button>
        }
      />
      <HeroSlidesTable data={slides} />
    </div>
  );
}
