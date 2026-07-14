"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaTrendChart } from "@/components/common/area-trend-chart";
import {
  getRateHistoryChart,
  type RateHistoryPoint,
} from "@/features/metal-rates/metal-rate.actions";
import type { RateMetalType } from "@/features/metal-rates/metal-rate.types";

const METAL_OPTIONS: { value: RateMetalType; label: string }[] = [
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "platinum", label: "Platinum" },
];

const RANGE_OPTIONS = [
  { value: "7", label: "Daily (7 days)" },
  { value: "30", label: "Weekly view (30 days)" },
  { value: "90", label: "Monthly view (90 days)" },
  { value: "365", label: "Yearly view (365 days)" },
];

/** Historical rate trend — metal + date-range selectors, backed by every stored MetalRate entry in the window (manual and API-sourced alike). */
export function PricingHistoryChart({
  initialData,
}: {
  initialData: RateHistoryPoint[];
}) {
  const [metalType, setMetalType] = useState<RateMetalType>("gold");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<RateHistoryPoint[]>(initialData);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getRateHistoryChart(metalType, days);
      setData(result);
    });
  }, [metalType, days]);

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Historical Rates</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={metalType}
            onValueChange={(v) => v && setMetalType(v as RateMetalType)}
          >
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METAL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(days)}
            onValueChange={(v) => v && setDays(Number(v))}
          >
            <SelectTrigger size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {isPending
              ? "Loading…"
              : "No rate history in this window yet."}
          </p>
        ) : (
          <AreaTrendChart
            data={data}
            valueLabel={`${metalType} ₹/g`}
            variant="line"
            className="h-64 w-full"
          />
        )}
      </CardContent>
    </Card>
  );
}
