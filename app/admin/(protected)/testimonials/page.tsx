import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TestimonialsTable } from "@/components/admin/testimonials-table";
import { Button } from "@/components/ui/button";
import { listTestimonials } from "@/features/testimonials/testimonial.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminTestimonialsPage() {
  const testimonials = await safeQuery(
    () => listTestimonials({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Testimonials"
        description={`${testimonials.length} testimonial${testimonials.length === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Testimonials" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.testimonialNew} />}
          >
            <Plus className="size-3.5" />
            New Testimonial
          </Button>
        }
      />
      <TestimonialsTable data={testimonials} />
    </div>
  );
}
