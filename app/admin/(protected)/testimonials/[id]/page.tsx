import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { getTestimonialByIdForAdmin } from "@/features/testimonials/testimonial.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditTestimonialPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTestimonialPage({
  params,
}: EditTestimonialPageProps) {
  const { id } = await params;
  const testimonial = await safeQuery(
    () => getTestimonialByIdForAdmin(id),
    null,
  );
  if (!testimonial) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={testimonial.name}
        breadcrumbs={[
          { label: "Testimonials", href: ROUTES.admin.testimonials },
          { label: testimonial.name },
        ]}
      />
      <TestimonialForm testimonial={testimonial} />
    </div>
  );
}
