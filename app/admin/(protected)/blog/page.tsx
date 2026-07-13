import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BlogPostsTable } from "@/components/admin/blog-posts-table";
import { Button } from "@/components/ui/button";
import { listBlogPosts } from "@/features/blog/blog-post.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { ROUTES } from "@/constants/routes";

export default async function AdminBlogPage() {
  const posts = await safeQuery(
    () => listBlogPosts({ publishedOnly: false }),
    [],
  );

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Blog"
        description={`${posts.length} post${posts.length === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Blog" }]}
        actions={
          <Button
            variant="gold"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.blogNew} />}
          >
            <Plus className="size-3.5" />
            New Post
          </Button>
        }
      />
      <BlogPostsTable data={posts} />
    </div>
  );
}
