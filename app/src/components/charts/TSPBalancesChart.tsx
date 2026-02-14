import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { TSPBalancesChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function TSPTooltip({ active, payload, theme }: { active?: boolean; payload?: Array<{ payload: { year: number; traditionalBalance: number; rothBalance: number; totalBalance: number } }>; theme: ReturnType<typeof useChartTheme> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <ChartTooltip>
      <p className="font-medium">{d.year}</p>
      <p style={{ color: theme.traditional }}>Traditional: {USD_FORMAT.format(d.traditionalBalance)}</p>
      <p style={{ color: theme.roth }}>Roth: {USD_FORMAT.format(d.rothBalance)}</p>
      <p className="font-medium" style={{ color: theme.textColor }}>Total: {USD_FORMAT.format(d.totalBalance)}</p>
    </ChartTooltip>
  );
}

export function TSPBalancesChart({ data }: TSPBalancesChartProps) {
  const theme = useChartTheme();

  return (
    <ChartContainer
      title="TSP Balance Growth"
      subtitle="Traditional and Roth TSP projected balances"
    >
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<TSPTooltip theme={theme} />} />
        <Area
          type="monotone"
          dataKey="traditionalBalance"
          stackId="tsp"
          stroke={theme.traditional}
          fill={theme.traditional}
          fillOpacity={0.5}
          name="Traditional"
        />
        <Area
          type="monotone"
          dataKey="rothBalance"
          stackId="tsp"
          stroke={theme.roth}
          fill={theme.roth}
          fillOpacity={0.5}
          name="Roth"
        />
      </AreaChart>
    </ChartContainer>
  );
}
