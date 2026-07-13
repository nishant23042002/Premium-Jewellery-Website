"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface TrendChartDatum {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendChartDatum[];
  valueLabel: string;
  className?: string;
}

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--color-gold)",
  },
} satisfies ChartConfig;

/**
 * Themed bar chart for admin-dashboard metrics (e.g. weekly enquiry
 * volume — PRD §44). Generic over `data`/`valueLabel` so it's reusable
 * across whichever metrics the dashboard ends up showing.
 */
export function TrendChart({ data, valueLabel, className }: TrendChartProps) {
  return (
    <ChartContainer config={chartConfig} className={className}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs"
        />
        <ChartTooltip
          content={<ChartTooltipContent labelKey="label" nameKey="value" />}
        />
        <Bar
          dataKey="value"
          name={valueLabel}
          fill="var(--color-gold)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  );
}
