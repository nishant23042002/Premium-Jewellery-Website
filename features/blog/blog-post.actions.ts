"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID, NOT_DELETED_FILTER } from "@/lib/db/schema-helpers";
import { BlogPostModel } from "@/features/blog/blog-post.model";
import {
  blogPostFormSchema,
  type BlogPostFormInput,
} from "@/features/blog/blog-post.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { BlogPost } from "@/features/blog/blog-post.types";

interface BlogPostDoc {
  _id: unknown;
  tenantId: string;
  slug: string;
  title: BlogPost["title"];
  excerpt: BlogPost["excerpt"];
  content: BlogPost["content"];
  category: string;
  coverImageUrl?: string | null;
  author: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function toBlogPost(doc: BlogPostDoc): BlogPost {
  return {
    id: String(doc._id),
    tenantId: doc.tenantId,
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    content: doc.content,
    category: doc.category,
    coverImageUrl: doc.coverImageUrl ?? undefined,
    author: doc.author,
    tags: doc.tags,
    isPublished: doc.isPublished,
    publishedAt: doc.publishedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listBlogPosts({
  publishedOnly = true,
}: { publishedOnly?: boolean } = {}): Promise<BlogPost[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    ...NOT_DELETED_FILTER,
  };
  if (publishedOnly) filter.isPublished = true;

  const docs = await BlogPostModel.find(filter)
    .sort({ publishedAt: -1 })
    .lean();
  return docs.map((doc) => toBlogPost(doc as unknown as BlogPostDoc));
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  await connectToDatabase();
  const doc = await BlogPostModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug,
    isPublished: true,
    ...NOT_DELETED_FILTER,
  }).lean();
  return doc ? toBlogPost(doc as unknown as BlogPostDoc) : null;
}

export async function getBlogPostByIdForAdmin(
  id: string,
): Promise<BlogPost | null> {
  await requireAdmin();
  await connectToDatabase();
  const doc = await BlogPostModel.findOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return doc ? toBlogPost(doc as unknown as BlogPostDoc) : null;
}

export async function createBlogPost(
  values: BlogPostFormInput,
): Promise<ActionResult<BlogPost>> {
  const session = await requirePermission("blog.manage");

  const parsed = blogPostFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid blog post data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const existing = await BlogPostModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug: parsed.data.slug,
  });
  if (existing) {
    return { success: false, error: "A post with this slug already exists" };
  }

  const doc = await BlogPostModel.create({
    ...parsed.data,
    tenantId: DEFAULT_TENANT_ID,
  });

  logAudit(session, "created", "blog_post", String(doc._id), doc.title.en);
  revalidatePath(ROUTES.admin.blog);
  return {
    success: true,
    data: toBlogPost(doc.toObject() as unknown as BlogPostDoc),
  };
}

export async function updateBlogPost(
  id: string,
  values: BlogPostFormInput,
): Promise<ActionResult<BlogPost>> {
  const session = await requirePermission("blog.manage");

  const parsed = blogPostFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid blog post data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectToDatabase();

  const doc = await BlogPostModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    parsed.data,
    { returnDocument: "after" },
  );

  if (!doc) {
    return { success: false, error: "Post not found" };
  }

  logAudit(session, "updated", "blog_post", String(doc._id), doc.title.en);
  revalidatePath(ROUTES.admin.blog);
  revalidatePath(`/blog/${doc.slug}`);
  return {
    success: true,
    data: toBlogPost(doc.toObject() as unknown as BlogPostDoc),
  };
}

/** Soft delete — moves the post to the Recycle Bin instead of destroying it outright. */
export async function deleteBlogPost(id: string): Promise<ActionResult> {
  const session = await requirePermission("blog.manage");
  await connectToDatabase();

  const doc = await BlogPostModel.findOneAndUpdate(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: new Date() },
  );
  if (!doc) {
    return { success: false, error: "Post not found" };
  }

  logAudit(session, "deleted", "blog_post", id, doc.title.en);
  revalidatePath(ROUTES.admin.blog);
  return { success: true, data: undefined };
}
