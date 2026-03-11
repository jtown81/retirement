import { useMemo } from 'react';
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
  config,
}: HealthcareCostChartProps) {
  const theme = useChartTheme();

  // Use actual healthcare config values if configured
  const hcBase = config.healthcareAnnualExpenses ?? 0;
  const hcInflation = config.healthcareInflationRate ?? config.inflationRate;

  // If healthcare not configured, show a fallback card
  if (hcBase === 0) {
    return (
      <ChartContainer
        title="Healthcare Cost Breakdown"
        subtitle="Healthcare vs other expenses over retirement"
      >
        <div className="p-6 bg-blue-50 border border-blue-200 rounded text-center">
          <p className="text-blue-900 font-medium">
            Healthcare expense data not configured
          </p>
          <p className="text-blue-700 text-sm mt-2">
            Add healthcare annual expenses in the Expenses form to see this breakdown.
          </p>
        </div>
      </ChartContainer>
    );
  }

  // Compute healthcare expenses per year using smile curve multiplier
  const chartData = useMemo(() => {
    return data.map((year, idx) => {
      const yearsRetired = idx;
      const smileMultiplier = year.smileMultiplier ?? 1;
      const healthcareExpenses = hcBase * Math.pow(1 + hcInflation, yearsRetired) * smileMultiplier;
      return {
        ...year,
        healthcareExpenses: Math.round(healthcareExpenses),
        nonHealthcareExpenses: Math.max(0, Math.round((year.totalExpenses ?? 0) - healthcareExpenses)),
      };
    });
  }, [data, hcBase, hcInflation]);

  return (
    <ChartContainer
      title="Healthcare Cost Breakdown"
      subtitle="Healthcare vs other expenses over retirement"
    >
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: theme.textColor }} interval="preserveStartEnd" />
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
