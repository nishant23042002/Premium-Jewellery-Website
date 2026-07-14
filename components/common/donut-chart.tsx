"use client";

import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { TrendChartDatum } from "@/components/common/trend-chart";

const SEGMENT_COLORS = [
  "var(--color-gold)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

interface DonutChartProps {
  data: TrendChartDatum[];
  className?: string;
}

/** Status/category breakdowns read better as a donut than a bar once there are only a handful of segments — pairs with a legend list showing each segment's share. */
export function DonutChart({ data, className }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const config = Object.fromEntries(
    data.map((d, i) => [
      d.label,
      { label: d.label, color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] },
    ]),
  );

  return (
    <div className="flex items-center gap-6">
      <ChartContainer config={config} className={className}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="60%"
            outerRadius="100%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.label}
                fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate capitalize text-muted-foreground">
              {d.label}
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {d.value}
            </span>
            <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
