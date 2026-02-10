import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import type { IncomeVsExpensesChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function IncExpTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { year: number; age: number; totalIncome: number; totalExpenses: number; surplus: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 shadow-sm text-sm">
      <p className="font-medium">{d.year} (Age {d.age})</p>
      <p className="text-green-600">Income: {USD_FORMAT.format(d.totalIncome)}</p>
      <p className="text-red-600">Expenses: {USD_FORMAT.format(d.totalExpenses)}</p>
      <p className={d.surplus >= 0 ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
        Surplus: {USD_FORMAT.format(d.surplus)}
      </p>
    </div>
  );
}

export function IncomeVsExpensesChart({ data }: IncomeVsExpensesChartProps) {
  return (
    <ChartContainer
      title="Retirement Income vs. Expenses"
      subtitle="Annual income and spending projection over your retirement horizon"
    >
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<IncExpTooltip />} />
        <ReferenceLine y={0} stroke="#6b7280" />
        <Area
          type="monotone"
          dataKey="surplus"
          fill="#dcfce7"
          stroke="none"
          fillOpacity={0.5}
        />
        <Line
          type="monotone"
          dataKey="totalIncome"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
          name="Income"
        />
        <Line
          type="monotone"
          dataKey="totalExpenses"
          stroke="#dc2626"
          strokeWidth={2}
          dot={false}
          name="Expenses"
        />
      </ComposedChart>
    </ChartContainer>
  );
}
