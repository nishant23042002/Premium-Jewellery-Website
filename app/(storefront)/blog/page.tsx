import type { Metadata } from "next";
import { Container } from "@/components/common/container";
import { Grid } from "@/components/common/grid";
import { BlogCard } from "@/components/marketing/blog-card";
import { PageHero } from "@/components/marketing/page-hero";
import { listBlogPosts } from "@/features/blog/blog-post.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Buying guides, care tips, and hallmarking explainers from Shree Ambika Jewellers.",
  keywords: ["jewellery buying guide", "jewellery care tips", "gold hallmarking guide"],
  ...canonicalFor(ROUTES.blog),
};

export default async function BlogIndexPage() {
  const posts = await safeQuery(() => listBlogPosts(), []);

  return (
    <>
      <PageHero
        eyebrow="Read"
        title="The Journal"
        description="Guides on buying, caring for, and understanding fine jewellery — written by our team."
        breadcrumbs={[{ label: "Journal" }]}
      />

      <section className="section pt-0">
        <Container>
          {posts.length > 0 ? (
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="lg">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </Grid>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                New articles are on the way — check back soon.
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
