import { formatWeight } from "@/lib/utils/format";
import type { Locale } from "@/types/common";
import type { Product } from "@/features/products/product.types";

interface SpecTableProps {
  product: Product;
  locale?: Locale;
  className?: string;
}

const MAKING_CHARGE_LABEL: Record<Product["makingChargeType"], string> = {
  percentage: "% of metal value",
  per_gram: "per gram",
  flat: "flat",
};

/** Reused on the product detail page and inside the comparison table (Phase 5 "Specification Tables"). */
export function SpecTable({
  product,
  locale = "en",
  className,
}: SpecTableProps) {
  const rows: [string, string][] = [
    ["SKU", product.skuCode],
    ["Metal", product.metalType[0].toUpperCase() + product.metalType.slice(1)],
    ["Purity", product.purity],
    ["Gross Weight", formatWeight(product.grossWeightGrams)],
    ["Net Weight", formatWeight(product.netWeightGrams)],
    [
      "Making Charge",
      `${product.makingChargeValue}${product.makingChargeType === "percentage" ? "%" : ""} ${MAKING_CHARGE_LABEL[product.makingChargeType]}`,
    ],
    ["GST", `${product.gstPercentage}%`],
  ];

  if (product.tags.length > 0) {
    rows.push(["Tags", product.tags.join(", ")]);
  }

  return (
    <table className={className}>
      <caption className="sr-only">
        Specifications for {product.name[locale]}
      </caption>
      <tbody className="divide-y divide-border">
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th
              scope="row"
              className="py-2 pr-4 text-left text-sm font-normal text-muted-foreground"
            >
              {label}
            </th>
            <td className="py-2 text-sm font-medium">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
