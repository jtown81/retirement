import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { HealthcareCostChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function HealthcareCostTooltip({
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
      <p style={{ color: '#ef4444' }}>
        Healthcare: {USD_FORMAT.format(d.healthcareExpenses || 0)}
      </p>
      <p style={{ color: '#3b82f6' }}>
        Other Expenses: {USD_FORMAT.format(d.nonHealthcareExpenses || 0)}
      </p>
    </ChartTooltip>
  );
}

export function HealthcareCostChart({
  data,
  healthcareInflationRate = 0.045,
}: HealthcareCostChartProps) {
  const theme = useChartTheme();

  // For now, we estimate healthcare as a percentage of total expenses
  // In the future, this should come from the config/simulation data directly
  const estimatedHealthcarePercentage = 0.15; // ~15% of typical retirement expenses

  const chartData = data.map((year) => ({
    ...year,
    healthcareExpenses: (year.totalExpenses ?? 0) * estimatedHealthcarePercentage,
    nonHealthcareExpenses: (year.totalExpenses ?? 0) * (1 - estimatedHealthcarePercentage),
  }));

  return (
    <ChartContainer
      title="Healthcare Cost Breakdown"
      subtitle="Healthcare vs other expenses over retirement"
    >
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<HealthcareCostTooltip theme={theme} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="healthcareExpenses"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          name="Healthcare Expenses"
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="nonHealthcareExpenses"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Other Expenses"
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
