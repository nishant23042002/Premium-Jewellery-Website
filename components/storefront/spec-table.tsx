import { formatWeight } from "@/lib/utils/format";
import { t } from "@/lib/i18n/dictionary";
import type { Locale, LocalizedText } from "@/types/common";
import type { Product } from "@/features/products/product.types";

interface SpecTableProps {
  product: Product;
  locale?: Locale;
  className?: string;
}

const MAKING_CHARGE_LABEL: Record<Product["makingChargeType"], LocalizedText> = {
  percentage: {
    en: "% of metal value",
    hi: "धातु मूल्य का %",
    mr: "धातू मूल्याच्या %",
  },
  per_gram: { en: "per gram", hi: "प्रति ग्राम", mr: "प्रति ग्रॅम" },
  flat: { en: "flat", hi: "फ्लैट", mr: "फ्लॅट" },
};

const TAGS_LABEL: LocalizedText = { en: "Tags", hi: "टैग", mr: "टॅग्स" };

/** Reused on the product detail page and inside the comparison table (Phase 5 "Specification Tables"). */
export function SpecTable({
  product,
  locale = "en",
  className,
}: SpecTableProps) {
  const rows: [string, string][] = [
    [t("skuLabel", locale).replace(/:$/, ""), product.skuCode],
    [t("metal", locale), product.metalType[0].toUpperCase() + product.metalType.slice(1)],
    [t("purity", locale), product.purity],
    [t("grossWeight", locale), formatWeight(product.grossWeightGrams)],
    [t("netWeight", locale), formatWeight(product.netWeightGrams)],
    [
      t("makingCharge", locale),
      `${product.makingChargeValue}${product.makingChargeType === "percentage" ? "%" : ""} ${MAKING_CHARGE_LABEL[product.makingChargeType][locale]}`,
    ],
    [t("gstLabel", locale), `${product.gstPercentage}%`],
  ];

  if (product.tags.length > 0) {
    rows.push([TAGS_LABEL[locale], product.tags.join(", ")]);
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
