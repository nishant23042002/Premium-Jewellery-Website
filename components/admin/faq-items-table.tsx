"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { deleteFaqItem, updateFaqItem } from "@/features/faq/faq-item.actions";
import { ROUTES } from "@/constants/routes";
import type { FaqItem } from "@/features/faq/faq-item.types";

const columns: ColumnDef<FaqItem>[] = [
  {
    accessorKey: "question",
    header: "Question",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.question.en}</span>
    ),
  },
  { accessorKey: "sortOrder", header: "Sort" },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.isPublished}
        onToggle={(next) =>
          updateFaqItem(row.original.id, {
            question: row.original.question,
            answer: row.original.answer,
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
        editHref={ROUTES.admin.faqItem(row.original.id)}
        itemLabel={row.original.question.en}
        onDelete={() => deleteFaqItem(row.original.id)}
      />
    ),
  },
];

export function FaqItemsTable({ data }: { data: FaqItem[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="question"
      searchPlaceholder="Search questions..."
    />
  );
}
