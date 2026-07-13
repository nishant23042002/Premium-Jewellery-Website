import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { ROUTES } from "@/constants/routes";

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="New Post"
        breadcrumbs={[
          { label: "Blog", href: ROUTES.admin.blog },
          { label: "New" },
        ]}
      />
      <BlogPostForm />
    </div>
  );
}
