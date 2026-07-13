import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RatesForm } from "@/components/admin/rates-form";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCurrentRates,
  listRateHistory,
} from "@/features/metal-rates/metal-rate.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { formatDate, formatINR } from "@/lib/utils/format";

export default async function AdminRatesPage() {
  const [currentRates, history] = await Promise.all([
    safeQuery(() => getCurrentRates(), { gold: null, silver: null }),
    safeQuery(() => listRateHistory(20), []),
  ]);

  return (
    <div className="mx-auto max-w-(--container-wide)">
      <AdminPageHeader
        title="Metal Rates"
        description="The single most important daily task — every product price on the site is computed from this."
        breadcrumbs={[{ label: "Metal Rates" }]}
      />

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <RatesForm currentRates={currentRates} />

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
                    className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0"
                  >
                    <span className="capitalize">
                      {rate.metalType} ({rate.purity})
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
    </div>
  );
}
