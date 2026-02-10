import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import type { ExpenseSmileCurveChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function SmileTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { yearsIntoRetirement: number; multiplier: number; adjustedExpenses: number; baseExpenses: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 shadow-sm text-sm">
      <p className="font-medium">Year {d.yearsIntoRetirement}</p>
      <p className="text-purple-600">Multiplier: {(d.multiplier * 100).toFixed(1)}%</p>
      <p className="text-orange-600">Adjusted: {USD_FORMAT.format(d.adjustedExpenses)}</p>
      <p className="text-gray-500">Base: {USD_FORMAT.format(d.baseExpenses)}</p>
    </div>
  );
}

export function ExpenseSmileCurveChart({ data }: ExpenseSmileCurveChartProps) {
  return (
    <ChartContainer
      title="Expense Smile Curve"
      subtitle="Retirement spending pattern: higher early/late, lower mid-retirement (Blanchett 2014)"
    >
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="yearsIntoRetirement"
          tick={{ fontSize: 12 }}
          label={{ value: 'Years into Retirement', position: 'insideBottom', offset: -5, fontSize: 12 }}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          tick={{ fontSize: 12 }}
          domain={[0.7, 1.1]}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<SmileTooltip />} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="multiplier"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={false}
          name="Multiplier"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="adjustedExpenses"
          stroke="#ea580c"
          strokeWidth={2}
          dot={false}
          name="Adjusted Expenses"
        />
      </LineChart>
    </ChartContainer>
  );
}
