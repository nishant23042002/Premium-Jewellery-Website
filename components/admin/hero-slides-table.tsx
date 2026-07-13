"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import {
  deleteHeroSlide,
  updateHeroSlide,
} from "@/features/hero-slides/hero-slide.actions";
import { ROUTES } from "@/constants/routes";
import type { HeroSlide } from "@/features/hero-slides/hero-slide.types";

const columns: ColumnDef<HeroSlide>[] = [
  {
    id: "mobile",
    header: "Mobile",
    cell: ({ row }) => (
      <Image
        src={row.original.mobileImageUrl}
        alt=""
        width={36}
        height={48}
        className="h-12 w-9 rounded-md border border-border object-cover"
      />
    ),
  },
  {
    id: "desktop",
    header: "Desktop",
    cell: ({ row }) => (
      <Image
        src={row.original.desktopImageUrl}
        alt=""
        width={80}
        height={32}
        className="h-8 w-20 rounded-md border border-border object-cover"
      />
    ),
  },
  {
    id: "altText",
    header: "Alt text",
    cell: ({ row }) => row.original.altText || "—",
  },
  { accessorKey: "sortOrder", header: "Sort" },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateHeroSlide(row.original.id, {
            mobileImageUrl: row.original.mobileImageUrl,
            desktopImageUrl: row.original.desktopImageUrl,
            altText: row.original.altText,
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
        editHref={ROUTES.admin.heroSlidesItem(row.original.id)}
        itemLabel="slide"
        onDelete={() => deleteHeroSlide(row.original.id)}
      />
    ),
  },
];

export function HeroSlidesTable({ data }: { data: HeroSlide[] }) {
  return <DataTable columns={columns} data={data} />;
}
