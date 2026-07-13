import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/marketing/page-hero";
import { getCmsPageBySlug } from "@/features/pages/page.actions";
import { safeQuery } from "@/lib/db/safe-query";

interface CmsPageRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CmsPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await safeQuery(() => getCmsPageBySlug(slug), null);
  if (!page) return { title: "Page" };
  return { title: page.title.en };
}

export default async function CmsPageRoute({ params }: CmsPageRouteProps) {
  const { slug } = await params;
  const page = await safeQuery(() => getCmsPageBySlug(slug), null);

  if (!page) notFound();

  const paragraphs = page.content.en.split(/\n\s*\n/).filter(Boolean);

  return (
    <>
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
