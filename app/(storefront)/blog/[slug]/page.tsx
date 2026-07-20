import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { ArticleJsonLd, BreadcrumbJsonLd } from "next-seo";
import { Container } from "@/components/common/container";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { ImageReveal } from "@/components/motion/image-reveal";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { getBlogPostBySlug } from "@/features/blog/blog-post.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { siteConfig } from "@/config/site.config";
import { ROUTES } from "@/constants/routes";
import { SITE } from "@/constants/site";
import { formatDate } from "@/lib/utils/format";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await safeQuery(() => getBlogPostBySlug(slug), null);
  if (!post) return { title: "Journal" };
  return {
    title: post.title.en,
    description: post.excerpt.en,
    keywords: [post.category, ...post.tags],
    ...canonicalFor(ROUTES.blogPost(post.slug)),
    openGraph: {
      title: post.title.en,
      description: post.excerpt.en,
      type: "article",
      publishedTime: post.publishedAt,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await safeQuery(() => getBlogPostBySlug(slug), null);

  if (!post) notFound();

  const paragraphs = post.content.en.split(/\n\s*\n/).filter(Boolean);

  return (
    <>
      <ArticleJsonLd
        type="BlogPosting"
        headline={post.title.en}
        description={post.excerpt.en}
        url={`${siteConfig.url}${ROUTES.blogPost(post.slug)}`}
        author={{ "@type": "Organization", name: SITE.name }}
        datePublished={post.publishedAt}
        dateModified={post.updatedAt}
        image={post.coverImageUrl ? [post.coverImageUrl] : []}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", item: siteConfig.url },
          { name: "Journal", item: `${siteConfig.url}${ROUTES.blog}` },
          { name: post.title.en },
        ]}
      />
      <PageHero
        eyebrow={post.category}
        title={post.title.en}
        description={`${formatDate(post.publishedAt)} · By ${post.author}`}
        breadcrumbs={[
          { label: "Journal", href: ROUTES.blog },
          { label: post.title.en },
        ]}
      />

      <section className="section pt-0">
        <Container className="max-w-2xl">
          <ImageReveal className="relative mb-10 aspect-16/9 rounded-2xl">
            {post.coverImageUrl ? (
              <Image
                src={post.coverImageUrl}
                alt={post.title.en}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 42rem, 100vw"
              />
            ) : (
              <PlaceholderImage
                seed={post.slug}
                icon={BookOpen}
                className="h-full w-full"
              />
            )}
          </ImageReveal>

          <div className="space-y-5">
            {paragraphs.map((paragraph, i) => (
              <Reveal key={i} index={i}>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {paragraph}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
