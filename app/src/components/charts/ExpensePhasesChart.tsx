import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { ExpensePhaseDataPoint } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface ExpensePhasesTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ExpensePhaseDataPoint;
  }>;
  theme: ReturnType<typeof useChartTheme>;
}

function ExpensePhasesTooltip({ active, payload, theme }: ExpensePhasesTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  const phaseColor =
    d.phase === 'GoGo' ? theme.goGo :
    d.phase === 'GoSlow' ? theme.goSlow :
    theme.noGo;

  return (
    <ChartTooltip>
      <p className="font-medium">{d.year} (Age {d.age}, {d.phase} phase)</p>
      <p style={{ color: phaseColor }}>{d.phase} Expenses: {USD_FORMAT.format(d.adjustedExpenses)}</p>
      <p style={{ color: theme.blanchett }}>
        Blanchett Model: {USD_FORMAT.format(d.blanchettAdjusted)}
      </p>
      {d.healthcareExpenses !== undefined && d.healthcareExpenses > 0 && (
        <p style={{ color: theme.healthcare }}>
          Healthcare: {USD_FORMAT.format(d.healthcareExpenses)}
        </p>
      )}
      {d.nonHealthcareExpenses !== undefined && d.nonHealthcareExpenses > 0 && (
        <p style={{ color: phaseColor }}>
          Other: {USD_FORMAT.format(d.nonHealthcareExpenses)}
        </p>
      )}
      <p style={{ color: theme.textColor }}>
        Base (today's $): {USD_FORMAT.format(d.baseExpenses)}
      </p>
      <p style={{ color: theme.textColor }}>
        Multiplier: {d.smileMultiplier.toFixed(2)}x
      </p>
    </ChartTooltip>
  );
}

export interface ExpensePhasesChartProps {
  data: ExpensePhaseDataPoint[];
}

export function ExpensePhasesChart({ data }: ExpensePhasesChartProps) {
  const theme = useChartTheme();

  if (data.length === 0) {
    return (
      <ChartContainer
        title="Expense Phases (Blanchett Smile Curve)"
        subtitle="Projected retirement spending pattern"
      >
        <div className="flex items-center justify-center h-[250px] lg:h-[350px] text-muted-foreground">
          No expense data available. Complete the Expenses form to enable this chart.
        </div>
      </ChartContainer>
    );
  }

  // Get phase transition ages from data
  const goGoEndAge = data.find((d) => d.phase === 'GoSlow')?.age ?? 75;
  const goSlowEndAge = data.find((d) => d.phase === 'NoGo')?.age ?? 85;

  return (
    <ChartContainer
      title="Expense Phases"
      subtitle="Expected spending pattern: GoGo (active), GoSlow (moderate), NoGo (reduced) with Blanchett comparison"
      minHeight={400}
    >
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<ExpensePhasesTooltip theme={theme} />} />

        {/* Phase transition reference lines */}
        <ReferenceLine
          x={goGoEndAge}
          stroke={theme.goSlow}
          strokeDasharray="5 5"
          label={{ value: `GoGo→GoSlow (${goGoEndAge})`, position: 'top', fill: theme.textColor, fontSize: 10 }}
        />
        <ReferenceLine
          x={goSlowEndAge}
          stroke={theme.noGo}
          strokeDasharray="5 5"
          label={{ value: `GoSlow→NoGo (${goSlowEndAge})`, position: 'top', fill: theme.textColor, fontSize: 10 }}
        />


        {/* Main expense area */}
        <Area
          type="monotone"
          dataKey="adjustedExpenses"
          fill={theme.goGo}
          stroke={theme.textColor}
          strokeWidth={2}
          fillOpacity={0.25}
          name="Total Expenses (Phase-Adjusted)"
        />

        {/* Blanchett reference line */}
        <Line
          type="monotone"
          dataKey="blanchettAdjusted"
          stroke={theme.blanchett}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Blanchett Model"
        />

        {/* Healthcare expense overlay if present */}
        {data.some((d) => (d.healthcareExpenses ?? 0) > 0) && (
          <Line
            type="monotone"
            dataKey="healthcareExpenses"
            stroke={theme.healthcare}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            name="Healthcare"
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
