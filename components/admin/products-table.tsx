"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, ImageOff, Trash2, XCircle } from "lucide-react";
import { DataTable, type BulkAction } from "@/components/common/data-table";
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
          width={56}
          height={56}
          className="size-14 rounded-lg border border-border object-cover"
        />
      ) : (
        <div className="flex size-14 items-center justify-center rounded-lg bg-muted">
          <ImageOff className="size-4 text-muted-foreground/50" />
        </div>
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

async function bulkSetPublished(rows: ProductWithPrice[], next: boolean) {
  const results = await Promise.all(
    rows.map(({ product }) =>
      updateProduct(product.id, {
        ...toProductFormInput(product),
        isPublished: next,
      }),
    ),
  );
  return {
    successCount: results.filter((r) => r.success).length,
    failureCount: results.filter((r) => !r.success).length,
  };
}

const bulkActions: BulkAction<ProductWithPrice>[] = [
  {
    label: "Publish",
    icon: CheckCircle2,
    onRun: (rows) => bulkSetPublished(rows, true),
  },
  {
    label: "Unpublish",
    icon: XCircle,
    onRun: (rows) => bulkSetPublished(rows, false),
  },
  {
    label: "Delete",
    icon: Trash2,
    variant: "destructive",
    confirmDescription:
      "This moves the selected products to the Recycle Bin — you can restore them later, or delete permanently from there.",
    onRun: async (rows) => {
      const results = await Promise.all(
        rows.map(({ product }) => deleteProduct(product.id)),
      );
      return {
        successCount: results.filter((r) => r.success).length,
        failureCount: results.filter((r) => !r.success).length,
      };
    },
  },
];

export function ProductsTable({ data }: { data: ProductWithPrice[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="name"
      searchPlaceholder="Search products..."
      getRowId={(row) => row.product.id}
      bulkActions={bulkActions}
      exportFileName="products"
      getExportRow={({ product, price }) => ({
        SKU: product.skuCode,
        Name: product.name.en,
        Metal: `${product.metalType} ${product.purity}`,
        Price: price.isRatePending ? "Rate pending" : price.total,
        Availability: product.availability,
        Published: product.isPublished ? "Yes" : "No",
      })}
      emptyTitle="No products yet"
      emptyDescription="Add your first product to see it listed here."
    />
  );
}
