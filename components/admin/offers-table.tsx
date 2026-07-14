"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { ImageOff } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { deleteOffer, updateOffer } from "@/features/offers/offer.actions";
import { formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import type { Offer } from "@/features/offers/offer.types";

const columns: ColumnDef<Offer>[] = [
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
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title.en}</span>
    ),
  },
  {
    id: "validUntil",
    header: "Valid Until",
    cell: ({ row }) => formatDate(row.original.validUntil),
  },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateOffer(row.original.id, {
            slug: row.original.slug,
            title: row.original.title,
            description: row.original.description,
            terms: row.original.terms,
            validUntil: row.original.validUntil,
            imageUrl: row.original.imageUrl ?? "",
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
        editHref={ROUTES.admin.offer(row.original.id)}
        itemLabel={row.original.title.en}
        onDelete={() => deleteOffer(row.original.id)}
      />
    ),
  },
];

export function OffersTable({ data }: { data: Offer[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="title"
      searchPlaceholder="Search offers..."
    />
  );
}
