import { formatINR } from "@/lib/utils/format";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import type { CurrentRates } from "@/features/metal-rates/metal-rate.actions";
import type { LocalizedText } from "@/types/common";

/** Not in STOREFRONT_DICTIONARY — this ticker's exact copy is unique to this leaf component. */
const GOLD_RATE_TICKER_TEXT = {
  gold22k: { en: "Gold (22K):", hi: "सोना (22K):", mr: "सोने (22K):" },
  silver: { en: "Silver:", hi: "चांदी:", mr: "चांदी:" },
  updatingSoon: {
    en: "Updating soon",
    hi: "जल्द अपडेट होगा",
    mr: "लवकरच अपडेट होईल",
  },
} as const satisfies Record<string, LocalizedText>;

/** Thin top-of-page announcement bar — today's rate is high-intent content (PRD §16, §4). */
export async function GoldRateTicker({ rates }: { rates: CurrentRates }) {
  const locale = await getStorefrontLocale();
  const text = {
    gold22k: GOLD_RATE_TICKER_TEXT.gold22k[locale],
    silver: GOLD_RATE_TICKER_TEXT.silver[locale],
    updatingSoon: GOLD_RATE_TICKER_TEXT.updatingSoon[locale],
  };

  return (
    <div className="flex h-9 items-center justify-center gap-6 bg-primary px-4 text-xs text-primary-foreground">
      <span>
        {text.gold22k}{" "}
        {rates.gold
          ? `${formatINR(rates.gold.ratePerGram)}/g`
          : text.updatingSoon}
      </span>
      <span className="h-3 w-px bg-primary-foreground/30" aria-hidden />
      <span>
        {text.silver}{" "}
        {rates.silver
          ? `${formatINR(rates.silver.ratePerGram)}/g`
          : text.updatingSoon}
      </span>
    </div>
  );
}
