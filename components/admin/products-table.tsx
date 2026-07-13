"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { DataTableRowActions } from "@/components/admin/data-table-row-actions";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { AvailabilityBadge } from "@/components/storefront/availability-badge";
import {
  deleteProduct,
  updateProduct,
} from "@/features/products/product.actions";
import { formatINR } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import type { ProductWithPrice } from "@/features/products/product.actions";

function toProductFormInput(product: ProductWithPrice["product"]) {
  return {
    categoryId: product.categoryId,
    slug: product.slug,
    skuCode: product.skuCode,
    name: product.name,
    description: product.description,
    metalType: product.metalType,
    purity: product.purity,
    grossWeightGrams: product.grossWeightGrams,
    netWeightGrams: product.netWeightGrams,
    makingChargeType: product.makingChargeType,
    makingChargeValue: product.makingChargeValue,
    gstPercentage: product.gstPercentage,
    images: product.images,
    videos: product.videos,
    availability: product.availability,
    isFeatured: product.isFeatured,
    tags: product.tags,
  };
}

const columns: ColumnDef<ProductWithPrice>[] = [
  {
    id: "image",
    header: "",
    cell: ({ row }) => {
      const image = row.original.product.images[0];
      return image ? (
        <Image
          src={image.url}
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-md border border-border object-cover"
        />
      ) : (
        <div className="size-10 rounded-md bg-muted" />
      );
    },
  },
  {
    id: "name",
    header: "Product",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.product.name.en}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.product.skuCode}
        </p>
      </div>
    ),
  },
  {
    id: "metal",
    header: "Metal",
    cell: ({ row }) =>
      `${row.original.product.metalType} · ${row.original.product.purity}`,
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) =>
      row.original.price.isRatePending
        ? "Rate pending"
        : formatINR(row.original.price.total),
  },
  {
    id: "availability",
    header: "Availability",
    cell: ({ row }) => (
      <AvailabilityBadge availability={row.original.product.availability} />
    ),
  },
  {
    id: "isPublished",
    header: "Published",
    cell: ({ row }) => (
      <PublishToggle
        checked={row.original.product.isPublished}
        onToggle={(next) =>
          updateProduct(row.original.product.id, {
            ...toProductFormInput(row.original.product),
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
        editHref={ROUTES.admin.product(row.original.product.id)}
        itemLabel={row.original.product.name.en}
        onDelete={() => deleteProduct(row.original.product.id)}
      />
    ),
  },
];

export function ProductsTable({ data }: { data: ProductWithPrice[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="name"
      searchPlaceholder="Search products..."
    />
  );
}
