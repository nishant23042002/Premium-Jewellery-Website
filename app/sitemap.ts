import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { ProductModel } from "@/features/products/product.model";
import { CategoryModel } from "@/features/categories/category.model";
import { CollectionModel } from "@/features/collections/collection.model";
import { BlogPostModel } from "@/features/blog/blog-post.model";
import { clientEnv } from "@/config/env";
import { ROUTES } from "@/constants/routes";

export const revalidate = 3600; // regenerate at most once an hour, not on every crawler hit

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: ROUTES.home, priority: 1 },
  { path: ROUTES.collections, priority: 0.8 },
  { path: ROUTES.categories, priority: 0.8 },
  { path: ROUTES.products, priority: 0.9 },
  { path: ROUTES.offers, priority: 0.7 },
  { path: ROUTES.blog, priority: 0.6 },
  { path: ROUTES.about, priority: 0.5 },
  { path: ROUTES.contact, priority: 0.5 },
  { path: ROUTES.reservation, priority: 0.7 },
  { path: ROUTES.faq, priority: 0.4 },
  { path: ROUTES.jewelleryCare, priority: 0.4 },
  { path: ROUTES.hallmark, priority: 0.4 },
  { path: ROUTES.gallery, priority: 0.4 },
  { path: ROUTES.testimonials, priority: 0.4 },
  { path: ROUTES.events, priority: 0.4 },
  { path: ROUTES.privacy, priority: 0.2 },
  { path: ROUTES.terms, priority: 0.2 },
];

/**
 * Native Next.js sitemap (replaces the old next-sitemap static-only setup,
 * which only ever covered the ~17 top-level routes and had no idea
 * products/categories/collections/blog posts existed — a real SEO gap for a
 * catalogue site). Pulls live, published slugs straight from the DB on each
 * regeneration instead of only what next-sitemap could discover by crawling
 * the build output.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDatabase();

  const baseUrl = clientEnv.NEXT_PUBLIC_SITE_URL;
  const filter = { tenantId: DEFAULT_TENANT_ID, isPublished: true, ...NOT_DELETED_FILTER };

  const [products, categories, collections, blogPosts] = await Promise.all([
    ProductModel.find(filter).select("slug updatedAt").lean(),
    CategoryModel.find(filter).select("slug updatedAt").lean(),
    CollectionModel.find(filter).select("slug updatedAt").lean(),
    BlogPostModel.find(filter).select("slug updatedAt").lean(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority }) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority,
    }),
  );

  const productEntries: MetadataRoute.Sitemap = products.map((doc) => ({
    url: `${baseUrl}${ROUTES.product(doc.slug)}`,
    lastModified: doc.updatedAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((doc) => ({
    url: `${baseUrl}${ROUTES.category(doc.slug)}`,
    lastModified: doc.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const collectionEntries: MetadataRoute.Sitemap = collections.map((doc) => ({
    url: `${baseUrl}${ROUTES.collection(doc.slug)}`,
    lastModified: doc.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((doc) => ({
    url: `${baseUrl}${ROUTES.blogPost(doc.slug)}`,
    lastModified: doc.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...productEntries,
    ...categoryEntries,
    ...collectionEntries,
    ...blogEntries,
  ];
}
