import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getBlogPostByIdForAdmin } from "@/features/blog/blog-post.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({
  params,
}: EditBlogPostPageProps) {
  const { id } = await params;
  const post = await safeQuery(() => getBlogPostByIdForAdmin(id), null);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title={post.title.en}
        breadcrumbs={[
          { label: "Blog", href: ROUTES.admin.blog },
          { label: post.title.en },
        ]}
      />
      <BlogPostForm post={post} />
    </div>
  );
}
