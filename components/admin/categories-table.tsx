"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { ImageOff } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import {
  deleteCategory,
  updateCategory,
} from "@/features/categories/category.actions";
import { ROUTES } from "@/constants/routes";
import type { Category } from "@/features/categories/category.types";

const columns: ColumnDef<Category>[] = [
  {
    id: "image",
    header: "",
    cell: ({ row }) =>
      row.original.imageUrl ? (
        <Image
          src={row.original.imageUrl}
          alt=""
          width={56}
          height={56}
          className="size-14 rounded-lg border border-border object-cover"
        />
      ) : (
        <div className="flex size-14 items-center justify-center rounded-lg bg-muted">
          <ImageOff className="size-4 text-muted-foreground/50" />
        </div>
      ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name.en}</span>
    ),
  },
  { accessorKey: "slug", header: "Slug" },
  { accessorKey: "sortOrder", header: "Sort" },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateCategory(row.original.id, {
            slug: row.original.slug,
            name: row.original.name,
            imageUrl: row.original.imageUrl ?? "",
            sortOrder: row.original.sortOrder,
            parentId: row.original.parentId,
            isPublished: next,
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
        editHref={ROUTES.admin.category(row.original.id)}
        itemLabel={row.original.name.en}
        onDelete={() => deleteCategory(row.original.id)}
      />
    ),
  },
];

export function CategoriesTable({ data }: { data: Category[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="name"
      searchPlaceholder="Search categories..."
    />
  );
}
