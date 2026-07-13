"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import {
  deleteGalleryImage,
  updateGalleryImage,
} from "@/features/gallery/gallery-image.actions";
import { ROUTES } from "@/constants/routes";
import type { GalleryImage } from "@/features/gallery/gallery-image.types";

const columns: ColumnDef<GalleryImage>[] = [
  {
    id: "image",
    header: "",
    cell: ({ row }) => (
      <Image
        src={row.original.imageUrl}
        alt=""
        width={48}
        height={48}
        className="size-12 rounded-md border border-border object-cover"
      />
    ),
  },
  {
    id: "caption",
    header: "Caption",
    cell: ({ row }) => row.original.caption?.en || "—",
  },
  { accessorKey: "sortOrder", header: "Sort" },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateGalleryImage(row.original.id, {
            imageUrl: row.original.imageUrl,
            caption: row.original.caption,
            sortOrder: row.original.sortOrder,
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
        editHref={ROUTES.admin.galleryItem(row.original.id)}
        itemLabel="image"
        onDelete={() => deleteGalleryImage(row.original.id)}
      />
    ),
  },
];

export function GalleryImagesTable({ data }: { data: GalleryImage[] }) {
  return <DataTable columns={columns} data={data} />;
}
