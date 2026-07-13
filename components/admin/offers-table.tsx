"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { deleteOffer, updateOffer } from "@/features/offers/offer.actions";
import { formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import type { Offer } from "@/features/offers/offer.types";

const columns: ColumnDef<Offer>[] = [
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
