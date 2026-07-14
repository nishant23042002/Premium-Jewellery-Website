"use client";

import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TrendChartDatum } from "@/components/common/trend-chart";

interface AreaTrendChartProps {
  data: TrendChartDatum[];
  valueLabel: string;
  className?: string;
  /** "area" gives a filled trend (volume-over-time); "line" is better for a rate/price series. */
  variant?: "area" | "line";
}

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--color-gold)",
  },
} satisfies ChartConfig;

/** Filled-area or plain-line trend — the day-by-day counterpart to the bar chart, better suited to reading momentum over a period. */
export function AreaTrendChart({
  data,
  valueLabel,
  className,
  variant = "area",
}: AreaTrendChartProps) {
  return (
    <ChartContainer config={chartConfig} className={className}>
      {variant === "area" ? (
        <AreaChart data={data}>
          <defs>
            <linearGradient id="area-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-gold)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-gold)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
          <Area
            dataKey="value"
            name={valueLabel}
            type="monotone"
            stroke="var(--color-gold)"
            strokeWidth={2}
            fill="url(#area-trend-fill)"
          />
        </AreaChart>
      ) : (
        <LineChart data={data}>
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
          <Line
            dataKey="value"
            name={valueLabel}
            type="monotone"
            stroke="var(--color-gold)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-gold)" }}
          />
        </LineChart>
      )}
    </ChartContainer>
  );
}
