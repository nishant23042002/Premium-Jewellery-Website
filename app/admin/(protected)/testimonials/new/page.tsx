import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { ROUTES } from "@/constants/routes";

export default function NewTestimonialPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Testimonial"
        breadcrumbs={[
          { label: "Testimonials", href: ROUTES.admin.testimonials },
          { label: "New" },
        ]}
      />
      <TestimonialForm />
    </div>
  );
}
