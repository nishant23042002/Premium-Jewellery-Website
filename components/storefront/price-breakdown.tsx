import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDate, formatINR, formatWeight } from "@/lib/utils/format";
import type { PriceBreakdown as PriceBreakdownType } from "@/features/products/product.types";

interface PriceBreakdownProps {
  price: PriceBreakdownType;
}

/**
 * The transparency trust-builder called out in PRD §21/§24 — weight,
 * making charge, GST as an expandable line-item accordion under the
 * headline total.
 */
export function PriceBreakdown({ price }: PriceBreakdownProps) {
  if (price.isRatePending) {
    return (
      <p className="text-sm text-muted-foreground">
        Today&apos;s rate hasn&apos;t been updated yet — please call the
        showroom for current pricing.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-heading text-3xl">{formatINR(price.total)}</p>
      <p className="text-xs text-muted-foreground">
        Based on {formatDate(price.rateEffectiveDate!)}&apos;s rate —{" "}
        {formatINR(price.metalRatePerGram)}/g
      </p>

      <Accordion defaultValue={[]}>
        <AccordionItem value="breakdown">
          <AccordionTrigger className="text-sm">
            Price breakdown
          </AccordionTrigger>
          <AccordionContent className="space-y-1.5 text-sm">
            <Row
              label={`Metal value (${formatWeight(price.weightGrams)})`}
              value={formatINR(price.metalValue)}
            />
            <Row label="Making charge" value={formatINR(price.makingCharge)} />
            <Row label="Subtotal" value={formatINR(price.subtotal)} />
            <Row label="GST" value={formatINR(price.gstAmount)} />
            <Row label="Total" value={formatINR(price.total)} emphasis />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${emphasis ? "font-medium" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
