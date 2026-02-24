import { memo } from 'react';
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
import { useChart } from './ChartContext';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { IncomeWaterfallDataPoint } from './chart-types';
import type { ChartContextValue } from './ChartContext';

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
  theme: ChartContextValue['theme'];
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

function IncomeWaterfallChartComponent({ data }: IncomeWaterfallChartProps) {
  const { theme, fontConfig } = useChart();

  return (
    <ChartContainer
      title="Retirement Income Waterfall"
      subtitle="Annual income sources and spending projection over 30-year retirement"
    >
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: fontConfig.fontSize, fill: theme.textColor }} interval={fontConfig.interval} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: fontConfig.fontSize, fill: theme.textColor }}
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
          isAnimationActive={false}
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
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="fersSupplement"
          stackId="income"
          fill={theme.supplement}
          stroke="none"
          fillOpacity={0.7}
          name="FERS Supplement"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="socialSecurity"
          stackId="income"
          fill={theme.socialSecurity}
          stroke="none"
          fillOpacity={0.7}
          name="Social Security"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="tspWithdrawal"
          stackId="income"
          fill={theme.tspWithdrawal}
          stroke="none"
          fillOpacity={0.7}
          name="TSP Withdrawal"
          isAnimationActive={false}
        />

        {/* Expense line overlay */}
        <Line
          type="monotone"
          dataKey="totalExpenses"
          stroke={theme.expenses}
          strokeWidth={2}
          dot={false}
          name="Expenses"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

export const IncomeWaterfallChart = memo(IncomeWaterfallChartComponent);
