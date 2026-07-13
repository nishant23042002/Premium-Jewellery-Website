import { formatINR } from "@/lib/utils/format";
import type { CurrentRates } from "@/features/metal-rates/metal-rate.actions";

/** Thin top-of-page announcement bar — today's rate is high-intent content (PRD §16, §4). */
export function GoldRateTicker({ rates }: { rates: CurrentRates }) {
  return (
    <div className="flex h-9 items-center justify-center gap-6 bg-primary px-4 text-xs text-primary-foreground">
      <span>
        Gold (22K):{" "}
        {rates.gold
          ? `${formatINR(rates.gold.ratePerGram)}/g`
          : "Updating soon"}
      </span>
      <span className="h-3 w-px bg-primary-foreground/30" aria-hidden />
      <span>
        Silver:{" "}
        {rates.silver
          ? `${formatINR(rates.silver.ratePerGram)}/g`
          : "Updating soon"}
      </span>
    </div>
  );
}
