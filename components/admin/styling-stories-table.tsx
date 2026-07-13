"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import {
  deleteStylingStory,
  updateStylingStory,
} from "@/features/styling-stories/styling-story.actions";
import { ROUTES } from "@/constants/routes";
import type { StylingStory } from "@/features/styling-stories/styling-story.types";

const columns: ColumnDef<StylingStory>[] = [
  {
    id: "cover",
    header: "",
    cell: ({ row }) =>
      row.original.coverImageUrl ? (
        <Image
          src={row.original.coverImageUrl}
          alt=""
          width={48}
          height={48}
          className="size-12 rounded-md border border-border object-cover"
        />
      ) : (
        <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
          No image
        </div>
      ),
  },
  {
    id: "title",
    header: "Title",
    cell: ({ row }) => row.original.title.en || "—",
  },
  { accessorKey: "sortOrder", header: "Sort" },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateStylingStory(row.original.id, {
            title: row.original.title,
            subtitle: row.original.subtitle,
            coverImageUrl: row.original.coverImageUrl,
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
        editHref={ROUTES.admin.stylingStoriesItem(row.original.id)}
        itemLabel="story"
        onDelete={() => deleteStylingStory(row.original.id)}
      />
    ),
  },
];

export function StylingStoriesTable({ data }: { data: StylingStory[] }) {
  return <DataTable columns={columns} data={data} />;
}
