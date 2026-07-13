"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { Badge } from "@/components/ui/badge";
import { deleteCmsPage, updateCmsPage } from "@/features/pages/page.actions";
import { ROUTES } from "@/constants/routes";
import type { CmsPage } from "@/features/pages/page.types";

const columns: ColumnDef<CmsPage>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title.en}</span>
    ),
  },
  {
    id: "slug",
    header: "URL",
    cell: ({ row }) => (
      <Badge variant="outline">/pages/{row.original.slug}</Badge>
    ),
  },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateCmsPage(row.original.id, {
            slug: row.original.slug,
            title: row.original.title,
            content: row.original.content,
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
        editHref={ROUTES.admin.page(row.original.id)}
        itemLabel={row.original.title.en}
        onDelete={() => deleteCmsPage(row.original.id)}
      />
    ),
  },
];

export function CmsPagesTable({ data }: { data: CmsPage[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="title"
      searchPlaceholder="Search pages..."
    />
  );
}
