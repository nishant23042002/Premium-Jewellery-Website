import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GrowthBadge } from "@/components/admin/growth-badge";
import { formatDate, formatINR } from "@/lib/utils/format";
import type { RateChangeSummary } from "@/features/metal-rates/metal-rate.actions";

const METAL_LABELS: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  platinum: "Platinum",
};

/** Today's rate per metal, 24h/7d/30d change, source, and last-updated — the Pricing Dashboard's headline row. */
export function PricingRateCards({
  summaries,
}: {
  summaries: RateChangeSummary[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {summaries.map((summary) => (
        <Card key={summary.metalType} className="border-border/60">
          <CardContent className="pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {METAL_LABELS[summary.metalType] ?? summary.metalType}
              </p>
              {summary.current && (
                <Badge
                  variant={summary.current.source === "api" ? "gold" : "outline"}
                  className="text-[0.65rem] capitalize"
                >
                  {summary.current.source === "api" ? "Live" : "Manual"}
                </Badge>
              )}
            </div>

            {summary.current ? (
              <>
                <p className="mt-1 font-heading text-2xl">
                  {formatINR(summary.current.ratePerGram)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /g
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[0.65rem] text-muted-foreground">24h</span>
                  <GrowthBadge percent={summary.change24h} />
                  <span className="text-[0.65rem] text-muted-foreground">7d</span>
                  <GrowthBadge percent={summary.change7d} />
                  <span className="text-[0.65rem] text-muted-foreground">30d</span>
                  <GrowthBadge percent={summary.change30d} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated {formatDate(summary.current.effectiveDate)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No rate set yet.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
