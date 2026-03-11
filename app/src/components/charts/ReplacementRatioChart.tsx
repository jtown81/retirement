import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { ReplacementRatioChartProps } from './chart-types';

function ReplacementRatioTooltip({
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

  const pctFormat = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <ChartTooltip>
      <p className="font-medium">{d.year} (Age {d.age})</p>
      <p style={{ color: '#3b82f6' }}>
        Replacement Ratio: {pctFormat.format(d.replacementRatio)}%
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Income: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.totalIncome || 0)}
      </p>
    </ChartTooltip>
  );
}

export function ReplacementRatioChart({
  data,
  preRetirementSalary,
}: ReplacementRatioChartProps) {
  const theme = useChartTheme();

  // Compute replacement ratio for each year
  const chartData = data.map((year) => ({
    ...year,
    replacementRatio: preRetirementSalary > 0 ? (year.totalIncome / preRetirementSalary) * 100 : 0,
  }));

  return (
    <ChartContainer
      title="Income Replacement Ratio"
      subtitle="Retirement income as % of pre-retirement salary (80% is typical target)"
    >
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          label={{ value: 'Replacement Ratio (%)', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<ReplacementRatioTooltip theme={theme} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine
          y={80}
          stroke={theme.borderColor}
          strokeDasharray="5 5"
          label={{ value: '80% Target', position: 'right', fill: theme.textColor, fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="replacementRatio"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Replacement Ratio"
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
