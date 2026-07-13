"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { Badge } from "@/components/ui/badge";
import {
  deleteCollection,
  updateCollection,
} from "@/features/collections/collection.actions";
import { ROUTES } from "@/constants/routes";
import type { Collection } from "@/features/collections/collection.types";

const columns: ColumnDef<Collection>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name.en}</span>
    ),
  },
  { accessorKey: "slug", header: "Slug" },
  {
    id: "products",
    header: "Pieces",
    cell: ({ row }) => row.original.productIds.length,
  },
  {
    id: "isFeatured",
    header: "Featured",
    cell: ({ row }) =>
      row.original.isFeatured ? <Badge variant="gold">Featured</Badge> : "—",
  },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateCollection(row.original.id, {
            slug: row.original.slug,
            name: row.original.name,
            description: row.original.description,
            imageUrl: row.original.imageUrl ?? "",
            productIds: row.original.productIds,
            isFeatured: row.original.isFeatured,
            isPublished: next,
            sortOrder: row.original.sortOrder,
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
        editHref={ROUTES.admin.collection(row.original.id)}
        itemLabel={row.original.name.en}
        onDelete={() => deleteCollection(row.original.id)}
      />
    ),
  },
];

export function CollectionsTable({ data }: { data: Collection[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="name"
      searchPlaceholder="Search collections..."
    />
  );
}
