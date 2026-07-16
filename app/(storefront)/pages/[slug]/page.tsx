import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "next-seo";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/marketing/page-hero";
import { getCmsPageBySlug } from "@/features/pages/page.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { canonicalFor } from "@/lib/seo/config";
import { siteConfig } from "@/config/site.config";

interface CmsPageRouteProps {
  params: Promise<{ slug: string }>;
}

/** First ~155 characters of the page's own content, on a word boundary — the closest thing this generic CMS page type has to a hand-written meta description. */
function summarize(text: string, maxLength = 155): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, trimmed.lastIndexOf(" ", maxLength))}…`;
}

export async function generateMetadata({
  params,
}: CmsPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await safeQuery(() => getCmsPageBySlug(slug), null);
  if (!page) return { title: "Page" };
  return {
    title: page.title.en,
    description: summarize(page.content.en),
    ...canonicalFor(`/pages/${page.slug}`),
  };
}

export default async function CmsPageRoute({ params }: CmsPageRouteProps) {
  const { slug } = await params;
  const page = await safeQuery(() => getCmsPageBySlug(slug), null);

  if (!page) notFound();

  const paragraphs = page.content.en.split(/\n\s*\n/).filter(Boolean);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", item: siteConfig.url },
          { name: page.title.en },
        ]}
      />
      <PageHero
        title={page.title.en}
        breadcrumbs={[{ label: page.title.en }]}
      />

      <section className="section pt-0">
        <Container className="max-w-2xl space-y-4 text-sm text-muted-foreground">
          {paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </Container>
      </section>
    </>
  );
}
