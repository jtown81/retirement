import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import type { TSPBalancesChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function TSPTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { year: number; traditionalBalance: number; rothBalance: number; totalBalance: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 shadow-sm text-sm">
      <p className="font-medium">{d.year}</p>
      <p className="text-blue-600">Traditional: {USD_FORMAT.format(d.traditionalBalance)}</p>
      <p className="text-emerald-600">Roth: {USD_FORMAT.format(d.rothBalance)}</p>
      <p className="font-medium text-gray-900">Total: {USD_FORMAT.format(d.totalBalance)}</p>
    </div>
  );
}

export function TSPBalancesChart({ data }: TSPBalancesChartProps) {
  return (
    <ChartContainer
      title="TSP Balance Growth"
      subtitle="Traditional and Roth TSP projected balances"
    >
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<TSPTooltip />} />
        <Area
          type="monotone"
          dataKey="traditionalBalance"
          stackId="tsp"
          stroke="#2563eb"
          fill="#93c5fd"
          fillOpacity={0.5}
          name="Traditional"
        />
        <Area
          type="monotone"
          dataKey="rothBalance"
          stackId="tsp"
          stroke="#059669"
          fill="#6ee7b7"
          fillOpacity={0.5}
          name="Roth"
        />
      </AreaChart>
    </ChartContainer>
  );
}
