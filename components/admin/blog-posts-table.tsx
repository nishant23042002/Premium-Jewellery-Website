"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import {
  deleteBlogPost,
  updateBlogPost,
} from "@/features/blog/blog-post.actions";
import { formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import type { BlogPost } from "@/features/blog/blog-post.types";

const columns: ColumnDef<BlogPost>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title.en}</span>
    ),
  },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "author", header: "Author" },
  {
    id: "publishedAt",
    header: "Published",
    cell: ({ row }) => formatDate(row.original.publishedAt),
  },
  {
    id: "isPublished",
    header: "Live",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateBlogPost(row.original.id, {
            slug: row.original.slug,
            title: row.original.title,
            excerpt: row.original.excerpt,
            content: row.original.content,
            category: row.original.category,
            coverImageUrl: row.original.coverImageUrl ?? "",
            author: row.original.author,
            tags: row.original.tags,
            isPublished: next,
            publishedAt: row.original.publishedAt,
          })
        }
      />
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <DataTableRowActions
        editHref={ROUTES.admin.blogPost(row.original.id)}
        itemLabel={row.original.title.en}
        onDelete={() => deleteBlogPost(row.original.id)}
      />
    ),
  },
];

export function BlogPostsTable({ data }: { data: BlogPost[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="title"
      searchPlaceholder="Search posts..."
    />
  );
}
