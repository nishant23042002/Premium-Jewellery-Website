import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RatesForm } from "@/components/admin/rates-form";
import { PricingRateCards } from "@/components/admin/pricing-rate-cards";
import { PricingProviderSettingsForm } from "@/components/admin/pricing-provider-settings-form";
import { PricingHistoryChart } from "@/components/admin/pricing-history-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getCurrentRates,
  getRateChangeSummaries,
  getRateHistoryChart,
  listRateHistory,
} from "@/features/metal-rates/metal-rate.actions";
import { getMetalRateProviderConfig } from "@/features/metal-rates/metal-rate-sync.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { getServerEnv } from "@/config/env";
import { formatDate, formatINR } from "@/lib/utils/format";

export default async function AdminRatesPage() {
  const [currentRates, history, summaries, providerConfig, historyChart] =
    await Promise.all([
      safeQuery(() => getCurrentRates(), { gold: null, silver: null, platinum: null }),
      safeQuery(() => listRateHistory(20), []),
      safeQuery(() => getRateChangeSummaries(), []),
      safeQuery(
        () => getMetalRateProviderConfig(),
        {
          enabled: false,
          refreshIntervalHours: 4,
          purityFactors: { gold: 22 / 24, silver: 1, platinum: 0.95 },
          lastFetch: { status: "never" as const, at: null },
        },
      ),
      safeQuery(() => getRateHistoryChart("gold", 30), []),
    ]);

  const apiKeyConfigured = Boolean(getServerEnv().METALS_DEV_API_KEY);

  return (
    <div className="mx-auto max-w-(--container-wide) space-y-6">
      <AdminPageHeader
        title="Pricing Dashboard"
        description="The single most important daily task — every product price on the site is computed from this."
        breadcrumbs={[{ label: "Metal Rates" }]}
      />

      <PricingRateCards summaries={summaries} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PricingProviderSettingsForm
          config={providerConfig}
          apiKeyConfigured={apiKeyConfigured}
        />
        <RatesForm currentRates={currentRates} />
      </div>

      <PricingHistoryChart initialData={historyChart} />

      <Card className="border-border/60">
        <CardContent className="pt-2">
          <p className="mb-3 text-xs text-muted-foreground">Rate History</p>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rates set yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((rate) => (
                <li
                  key={rate.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-sm last:border-0"
                >
                  <span className="flex items-center gap-2 capitalize">
                    {rate.metalType} ({rate.purity})
                    <Badge
                      variant={rate.source === "api" ? "gold" : "outline"}
                      className="text-[0.65rem] normal-case"
                    >
                      {rate.source === "api"
                        ? (rate.providerName ?? "API")
                        : "Manual"}
                    </Badge>
                  </span>
                  <span className="font-medium">
                    {formatINR(rate.ratePerGram)}/g
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(rate.effectiveDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
