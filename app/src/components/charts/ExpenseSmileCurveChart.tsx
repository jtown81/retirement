import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { ExpenseSmileCurveChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function SmileTooltip({ active, payload, theme }: { active?: boolean; payload?: Array<{ payload: { yearsIntoRetirement: number; multiplier: number; adjustedExpenses: number; baseExpenses: number } }>; theme: ReturnType<typeof useChartTheme> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <ChartTooltip>
      <p className="font-medium">Year {d.yearsIntoRetirement}</p>
      <p style={{ color: theme.expenses }}>Multiplier: {(d.multiplier * 100).toFixed(1)}%</p>
      <p style={{ color: theme.expenses }}>Adjusted: {USD_FORMAT.format(d.adjustedExpenses)}</p>
      <p className="text-muted-foreground">Base: {USD_FORMAT.format(d.baseExpenses)}</p>
    </ChartTooltip>
  );
}

export function ExpenseSmileCurveChart({ data }: ExpenseSmileCurveChartProps) {
  const theme = useChartTheme();

  return (
    <ChartContainer
      title="Expense Smile Curve"
      subtitle="Retirement spending pattern: higher early/late, lower mid-retirement (Blanchett 2014)"
    >
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          dataKey="yearsIntoRetirement"
          tick={{ fontSize: 12, fill: theme.textColor }}
          label={{ value: 'Years into Retirement', position: 'insideBottom', offset: -5, fontSize: 12, fill: theme.textColor }}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          tick={{ fontSize: 12, fill: theme.textColor }}
          domain={[0.7, 1.1]}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<SmileTooltip theme={theme} />} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="multiplier"
          stroke={theme.expenses}
          strokeWidth={2}
          dot={false}
          name="Multiplier"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="adjustedExpenses"
          stroke={theme.expenses}
          strokeWidth={2}
          dot={false}
          name="Adjusted Expenses"
        />
      </LineChart>
    </ChartContainer>
  );
}
