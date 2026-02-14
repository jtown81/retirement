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
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { IncomeVsExpensesChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function IncExpTooltip({ active, payload, theme }: { active?: boolean; payload?: Array<{ payload: { year: number; age: number; totalIncome: number; totalExpenses: number; surplus: number } }>; theme: ReturnType<typeof useChartTheme> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <ChartTooltip>
      <p className="font-medium">{d.year} (Age {d.age})</p>
      <p style={{ color: theme.income }}>Income: {USD_FORMAT.format(d.totalIncome)}</p>
      <p style={{ color: theme.expenses }}>Expenses: {USD_FORMAT.format(d.totalExpenses)}</p>
      <p style={{ color: d.surplus >= 0 ? theme.income : theme.expenses }} className="font-medium">
        Surplus: {USD_FORMAT.format(d.surplus)}
      </p>
    </ChartTooltip>
  );
}

export function IncomeVsExpensesChart({ data }: IncomeVsExpensesChartProps) {
  const theme = useChartTheme();

  return (
    <ChartContainer
      title="Retirement Income vs. Expenses"
      subtitle="Annual income and spending projection over your retirement horizon"
    >
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<IncExpTooltip theme={theme} />} />
        <ReferenceLine y={0} stroke={theme.borderColor} />
        <Area
          type="monotone"
          dataKey="surplus"
          fill={theme.surplus}
          stroke="none"
          fillOpacity={0.5}
        />
        <Line
          type="monotone"
          dataKey="totalIncome"
          stroke={theme.income}
          strokeWidth={2}
          dot={false}
          name="Income"
        />
        <Line
          type="monotone"
          dataKey="totalExpenses"
          stroke={theme.expenses}
          strokeWidth={2}
          dot={false}
          name="Expenses"
        />
      </ComposedChart>
    </ChartContainer>
  );
}
