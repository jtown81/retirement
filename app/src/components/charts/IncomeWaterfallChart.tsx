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
import type { IncomeWaterfallDataPoint } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface IncomeWaterfallTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: IncomeWaterfallDataPoint;
  }>;
  theme: ReturnType<typeof useChartTheme>;
}

function IncomeWaterfallTooltip({ active, payload, theme }: IncomeWaterfallTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  return (
    <ChartTooltip>
      <p className="font-medium">{d.year} (Age {d.age})</p>
      <p style={{ color: theme.annuity }}>Annuity: {USD_FORMAT.format(d.annuity)}</p>
      {d.fersSupplement > 0 && (
        <p style={{ color: theme.supplement }}>Supplement: {USD_FORMAT.format(d.fersSupplement)}</p>
      )}
      {d.socialSecurity > 0 && (
        <p style={{ color: theme.socialSecurity }}>Social Security: {USD_FORMAT.format(d.socialSecurity)}</p>
      )}
      <p style={{ color: theme.tspWithdrawal }}>TSP Withdrawal: {USD_FORMAT.format(d.tspWithdrawal)}</p>
      <p className="font-medium" style={{ color: theme.income }}>
        Total Income: {USD_FORMAT.format(d.totalIncome)}
      </p>
      <p style={{ color: theme.expenses }}>Expenses: {USD_FORMAT.format(d.totalExpenses)}</p>
      <p
        className="font-medium"
        style={{ color: d.surplus >= 0 ? theme.income : theme.expenses }}
      >
        Surplus: {USD_FORMAT.format(d.surplus)}
      </p>
    </ChartTooltip>
  );
}

export interface IncomeWaterfallChartProps {
  data: IncomeWaterfallDataPoint[];
}

export function IncomeWaterfallChart({ data }: IncomeWaterfallChartProps) {
  const theme = useChartTheme();

  return (
    <ChartContainer
      title="Retirement Income Waterfall"
      subtitle="Annual income sources and spending projection over 30-year retirement"
    >
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<IncomeWaterfallTooltip theme={theme} />} />
        <ReferenceLine y={0} stroke={theme.borderColor} />

        {/* Surplus/deficit background area */}
        <Area
          type="monotone"
          dataKey="surplus"
          fill={theme.surplus}
          stroke="none"
          fillOpacity={0.3}
        />

        {/* Stacked income areas: Annuity (base) + Supplement + SS + TSP */}
        <Area
          type="monotone"
          dataKey="annuity"
          stackId="income"
          fill={theme.annuity}
          stroke="none"
          fillOpacity={0.7}
          name="Annuity"
        />
        <Area
          type="monotone"
          dataKey="fersSupplement"
          stackId="income"
          fill={theme.supplement}
          stroke="none"
          fillOpacity={0.7}
          name="FERS Supplement"
        />
        <Area
          type="monotone"
          dataKey="socialSecurity"
          stackId="income"
          fill={theme.socialSecurity}
          stroke="none"
          fillOpacity={0.7}
          name="Social Security"
        />
        <Area
          type="monotone"
          dataKey="tspWithdrawal"
          stackId="income"
          fill={theme.tspWithdrawal}
          stroke="none"
          fillOpacity={0.7}
          name="TSP Withdrawal"
        />

        {/* Expense line overlay */}
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
