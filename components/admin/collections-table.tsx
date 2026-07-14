"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { ImageOff } from "lucide-react";
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
