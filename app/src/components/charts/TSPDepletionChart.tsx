import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { TSPDepletionChartProps } from './chart-types';
import { runMonteCarlo } from '@modules/simulation/monte-carlo';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function TSPDepletionTooltip({
  active,
  payload,
  theme,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; payload: any }>;
  theme: ReturnType<typeof useChartTheme>;
}) {
  if (!active || !payload) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <ChartTooltip>
      <p className="font-medium">{d.year} (Age {d.age})</p>
      <p style={{ color: '#93c5fd' }}>
        p10 (Pessimistic): {USD_FORMAT.format(d.p10 || 0)}
      </p>
      <p style={{ color: '#1e40af' }}>
        p50 (Median): {USD_FORMAT.format(d.p50 || 0)}
      </p>
      <p style={{ color: '#93c5fd' }}>
        p90 (Optimistic): {USD_FORMAT.format(d.p90 || 0)}
      </p>
      {d.p50 === 0 && (
        <p className="text-xs text-red-600 font-medium">TSP Depleted (median)</p>
      )}
    </ChartTooltip>
  );
}

/**
 * TSP Depletion Chart
 *
 * Shows projected TSP balance trajectory with Monte Carlo confidence bands (p10/p50/p90).
 * Runs N=200 stochastic simulations sampling returns from a normal distribution.
 */
export function TSPDepletionChart({ data, config }: TSPDepletionChartProps) {
  const theme = useChartTheme();

  // Run Monte Carlo to get confidence bands
  const mcResults = useMemo(() => {
    return runMonteCarlo(config, 200);
  }, [config]);

  // Find the year TSP depletes (if ever) using p50 (median)
  const depletionYear = mcResults.find((year) => (year.p50 ?? 0) <= 0);
  const depletionAge = depletionYear?.age;

  // Prepare chart data: merge deterministic data with MC percentiles
  const chartData = data.map((year, idx) => ({
    year: year.year,
    age: year.age,
    p10: mcResults[idx]?.p10 ?? 0,
    p50: mcResults[idx]?.p50 ?? 0,
    p90: mcResults[idx]?.p90 ?? 0,
  }));

  return (
    <ChartContainer
      title="TSP Balance Depletion"
      subtitle="Projected TSP account balance over retirement"
    >
      <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<TSPDepletionTooltip theme={theme} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {/* Confidence bands: p10–p50 fill */}
        <Area
          type="monotone"
          dataKey="p10"
          fill="#93c5fd"
          stroke="none"
          fillOpacity={0.3}
          name="p10 (Pessimistic)"
          isAnimationActive={false}
        />
        {/* p50–p90 fill (actually p50 to p90 should be above) */}
        <Area
          type="monotone"
          dataKey="p90"
          fill="#93c5fd"
          stroke="none"
          fillOpacity={0.3}
          name="p90 (Optimistic)"
          isAnimationActive={false}
        />
        {/* Median line */}
        <Area
          type="monotone"
          dataKey="p50"
          fill="none"
          stroke="#1e40af"
          strokeWidth={2}
          fillOpacity={0}
          name="p50 (Median)"
          isAnimationActive={false}
        />
      </AreaChart>
      {depletionAge && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
          <p className="text-amber-900 font-medium">
            TSP projected to be depleted at age {depletionAge}
          </p>
          <p className="text-amber-700 text-xs mt-1">
            Consider adjusting withdrawal rate or increasing investment returns to extend TSP longevity.
          </p>
        </div>
      )}
    </ChartContainer>
  );
}
