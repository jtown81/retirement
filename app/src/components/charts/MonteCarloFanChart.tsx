'use client';

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { MonteCarloYearBand, MonteCarloFanChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface MonteCarloTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: MonteCarloYearBand;
  }>;
  theme: ReturnType<typeof useChartTheme>;
}

function MonteCarloTooltip({ active, payload, theme }: MonteCarloTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  return (
    <ChartTooltip>
      <p className="font-medium">Age {d.age} ({d.year})</p>
      <p style={{ color: theme.income }}>P10: {USD_FORMAT.format(d.p10_balance)}</p>
      <p style={{ color: theme.highRisk }}>P25: {USD_FORMAT.format(d.p25_balance)}</p>
      <p className="font-bold" style={{ color: theme.textColor }}>
        P50 (Median): {USD_FORMAT.format(d.p50_balance)}
      </p>
      <p style={{ color: theme.lowRisk }}>P75: {USD_FORMAT.format(d.p75_balance)}</p>
      <p style={{ color: theme.roth }}>P90: {USD_FORMAT.format(d.p90_balance)}</p>
      <p className="text-sm" style={{ color: '#888' }}>
        Success Rate: {(d.successRate * 100).toFixed(1)}%
      </p>
    </ChartTooltip>
  );
}

export function MonteCarloFanChart({ data, overallSuccessRate, successRateAt85 }: MonteCarloFanChartProps) {
  const theme = useChartTheme();

  // Determine success badge color
  const successBadgeColor =
    overallSuccessRate >= 0.8 ? '#16a34a' : overallSuccessRate >= 0.6 ? '#eab308' : '#dc2626';
  const successBadgeLabel =
    overallSuccessRate >= 0.8 ? 'Good' : overallSuccessRate >= 0.6 ? 'Fair' : 'Low';

  // Helper function to compute bandwidth needed for stacked areas
  // P10 → P50 range (lower band)
  const computeLowerBand = (point: MonteCarloYearBand) => ({
    ...point,
    lowerBandValue: point.p50_balance - point.p10_balance,
  });

  // P50 → P90 range (upper band)
  const computeUpperBand = (point: MonteCarloYearBand) => ({
    ...point,
    upperBandValue: point.p90_balance - point.p50_balance,
  });

  const dataWithBands = data.map((point) => ({
    ...computeLowerBand(point),
    ...computeUpperBand(point),
  }));

  return (
    <ChartContainer
      title="Monte Carlo Confidence Bands"
      subtitle="TSP balance range (P10–P90) across 1000 market scenarios"
      minHeight={400}
    >
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={dataWithBands} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
            <XAxis
              dataKey="age"
              label={{ value: 'Age', position: 'insideBottomRight', offset: -5, fill: theme.textColor }}
              tick={{ fontSize: 12, fill: theme.textColor }}
            />
            <YAxis
              tickFormatter={(v: number) => `$${(v / 1000000).toFixed(1)}M`}
              tick={{ fontSize: 12, fill: theme.textColor }}
              label={{ value: 'TSP Balance', angle: -90, position: 'insideLeft', fill: theme.textColor }}
            />
            <Tooltip content={<MonteCarloTooltip theme={theme} />} />

            {/* Age 85 milestone marker */}
            <ReferenceLine
              x={85}
              stroke={theme.borderColor}
              strokeDasharray="5 5"
              label={{
                value: 'Age 85',
                position: 'top',
                fill: theme.textColor,
                fontSize: 11,
              }}
            />

            {/* P10–P50 confidence band (lower, semi-transparent) */}
            <Area
              type="monotone"
              dataKey="lowerBandValue"
              stackId="confidence"
              fill={theme.traditional}
              stroke="none"
              fillOpacity={0.2}
              isAnimationActive={false}
              name="P10–P50 Band"
            />

            {/* P50–P90 confidence band (upper, slightly darker) */}
            <Area
              type="monotone"
              dataKey="upperBandValue"
              stackId="confidence"
              fill={theme.traditional}
              stroke="none"
              fillOpacity={0.3}
              isAnimationActive={false}
              name="P50–P90 Band"
            />

            {/* Median line (P50, solid) */}
            <Line
              type="monotone"
              dataKey="p50_balance"
              stroke={theme.traditional}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              name="Median (P50)"
            />

            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{
                paddingBottom: '1rem',
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Success rate summary card */}
        <div className="rounded-lg border border-border bg-muted p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-lg font-bold">
                {(overallSuccessRate * 100).toFixed(0)}% to age {data[data.length - 1]?.age ?? '?'}
              </p>
              {successRateAt85 > 0 && (
                <p className="text-xs text-muted-foreground">
                  {(successRateAt85 * 100).toFixed(0)}% survive to age 85
                </p>
              )}
            </div>
            <div
              className="rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: successBadgeColor }}
            >
              {successBadgeLabel}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Based on 1,000 market scenarios with randomized annual returns (stocks: σ=16%, bonds: σ=5%).
          </p>
        </div>
      </div>
    </ChartContainer>
  );
}
