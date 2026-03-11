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
      <p style={{ color: '#3b82f6' }}>
        TSP Balance: {USD_FORMAT.format(d.tspBalance || 0)}
      </p>
      {d.tspBalance === 0 && (
        <p className="text-xs text-red-600 font-medium">TSP Depleted</p>
      )}
    </ChartTooltip>
  );
}

/**
 * TSP Depletion Chart
 *
 * Shows projected TSP balance trajectory and when funds may be depleted.
 * Current implementation uses deterministic projection from fullSimulation.
 * Future: integrate with Monte Carlo for confidence intervals (p10/p50/p90).
 */
export function TSPDepletionChart({ data }: TSPDepletionChartProps) {
  const theme = useChartTheme();

  // Find the year TSP depletes (if ever)
  const depletionYear = data.find((year) => (year.totalTSPBalance ?? 0) <= 0);
  const depletionAge = depletionYear?.age;

  // Prepare chart data
  const chartData = data.map((year) => ({
    ...year,
    tspBalance: Math.max(0, year.totalTSPBalance ?? 0),
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
        <Area
          type="monotone"
          dataKey="tspBalance"
          fill="#3b82f6"
          stroke="#1e40af"
          fillOpacity={0.6}
          name="TSP Balance"
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
