import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDate, formatINR, formatWeight } from "@/lib/utils/format";
import { t } from "@/lib/i18n/dictionary";
import type { PriceBreakdown as PriceBreakdownType } from "@/features/products/product.types";
import type { Locale, LocalizedText } from "@/types/common";

interface PriceBreakdownProps {
  price: PriceBreakdownType;
  locale?: Locale;
}

/** Page/component-local copy — too specific to this breakdown table for the shared dictionary. */
const COPY: Record<string, LocalizedText> = {
  ratePending: {
    en: "Today's rate hasn't been updated yet — please call the showroom for current pricing.",
    hi: "आज की दर अभी अपडेट नहीं हुई है — कृपया मौजूदा कीमत के लिए शोरूम को कॉल करें।",
    mr: "आजचा दर अद्याप अपडेट झालेला नाही — कृपया सध्याच्या किमतीसाठी शोरूमला कॉल करा.",
  },
  specialPrice: { en: "Special price", hi: "विशेष कीमत", mr: "विशेष किंमत" },
  basedOnRate: { en: "Based on", hi: "पर आधारित", mr: "यावर आधारित" },
  ratePrefix: {
    en: "'s rate —",
    hi: " की दर —",
    mr: " च्या दरावर —",
  },
  priceBreakdown: { en: "Price breakdown", hi: "मूल्य विवरण", mr: "किंमत तपशील" },
  metalValue: { en: "Metal value", hi: "धातु मूल्य", mr: "धातू मूल्य" },
  stoneValue: { en: "Stone value", hi: "स्टोन मूल्य", mr: "स्टोन मूल्य" },
  certification: { en: "Certification", hi: "प्रमाणन", mr: "प्रमाणन" },
  otherCharges: { en: "Other charges", hi: "अन्य शुल्क", mr: "इतर शुल्क" },
  total: { en: "Total", hi: "कुल", mr: "एकूण" },
};

/**
 * The transparency trust-builder called out in PRD §21/§24 — weight,
 * making charge, GST as an expandable line-item accordion under the
 * headline total.
 */
export function PriceBreakdown({ price, locale = "en" }: PriceBreakdownProps) {
  if (price.isRatePending) {
    return (
      <p className="text-sm text-muted-foreground">{COPY.ratePending[locale]}</p>
    );
  }

  // A locked/fixed price isn't formula-derived, so there's nothing
  // meaningful to itemize — the line items above would be zeroed and
  // wouldn't sum to the total, which reads as broken rather than simple.
  if (price.isOverridden) {
    return (
      <div className="space-y-2">
        <p className="font-heading text-3xl">{formatINR(price.total)}</p>
        <p className="text-xs text-muted-foreground">{COPY.specialPrice[locale]}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-heading text-3xl">{formatINR(price.total)}</p>
      <p className="text-xs text-muted-foreground">
        {COPY.basedOnRate[locale]} {formatDate(price.rateEffectiveDate!)}
        {COPY.ratePrefix[locale]} {formatINR(price.metalRatePerGram)}/g
      </p>

      <Accordion defaultValue={[]}>
        <AccordionItem value="breakdown">
          <AccordionTrigger className="text-sm">
            {COPY.priceBreakdown[locale]}
          </AccordionTrigger>
          <AccordionContent className="space-y-1.5 text-sm">
            <Row
              label={`${COPY.metalValue[locale]} (${formatWeight(price.weightGrams)})`}
              value={formatINR(price.metalValue)}
            />
            <Row label={t("makingCharge", locale)} value={formatINR(price.makingCharge)} />
            {price.stoneValue > 0 && (
              <Row label={COPY.stoneValue[locale]} value={formatINR(price.stoneValue)} />
            )}
            {price.certificationCost > 0 && (
              <Row
                label={COPY.certification[locale]}
                value={formatINR(price.certificationCost)}
              />
            )}
            {price.customCharges > 0 && (
              <Row
                label={COPY.otherCharges[locale]}
                value={formatINR(price.customCharges)}
              />
            )}
            <Row label={t("subtotal", locale)} value={formatINR(price.subtotal)} />
            <Row label={t("gstLabel", locale)} value={formatINR(price.gstAmount)} />
            <Row label={COPY.total[locale]} value={formatINR(price.total)} emphasis />
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
