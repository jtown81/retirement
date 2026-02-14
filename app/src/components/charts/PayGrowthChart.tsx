import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { PayGrowthChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function PayTooltip({ active, payload, theme }: { active?: boolean; payload?: Array<{ payload: { year: number; salary: number; grade: number; step: number } }>; theme: ReturnType<typeof useChartTheme> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <ChartTooltip>
      <p className="font-medium">{d.year}</p>
      <p style={{ color: theme.salary }}>
        {USD_FORMAT.format(d.salary)}
      </p>
      <p className="text-muted-foreground">GS-{d.grade} Step {d.step}</p>
    </ChartTooltip>
  );
}

export function PayGrowthChart({ data, retirementYear }: PayGrowthChartProps) {
  const theme = useChartTheme();

  return (
    <ChartContainer
      title="Pay Growth Over Career"
      subtitle="Annual salary progression by grade and step"
    >
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<PayTooltip theme={theme} />} />
        <Line
          type="stepAfter"
          dataKey="salary"
          stroke={theme.salary}
          strokeWidth={2}
          dot={false}
        />
        {retirementYear && (
          <ReferenceLine
            x={retirementYear}
            stroke={theme.expenses}
            strokeDasharray="4 4"
            label={{ value: 'Retire', position: 'top', fontSize: 12, fill: theme.textColor }}
          />
        )}
      </LineChart>
    </ChartContainer>
  );
}
