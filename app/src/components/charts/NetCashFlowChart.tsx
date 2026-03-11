import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { NetCashFlowChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function NetCashFlowTooltip({
  active,
  payload,
  theme,
}: {
  active?: boolean;
  payload?: Array<{ payload: { year: number; age: number; surplus: number } }>;
  theme: ReturnType<typeof useChartTheme>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <ChartTooltip>
      <p className="font-medium">{d.year} (Age {d.age})</p>
      <p style={{ color: d.surplus >= 0 ? theme.income : theme.expenses }}>
        Net Cash Flow: {USD_FORMAT.format(d.surplus)}
      </p>
    </ChartTooltip>
  );
}

export function NetCashFlowChart({ data }: NetCashFlowChartProps) {
  const theme = useChartTheme();

  return (
    <ChartContainer
      title="Net Cash Flow"
      subtitle="Annual surplus or deficit (income minus expenses)"
    >
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<NetCashFlowTooltip theme={theme} />} />
        <ReferenceLine y={0} stroke={theme.borderColor} strokeWidth={2} />
        <Bar
          dataKey="surplus"
          fill={theme.income}
          name="Net Cash Flow"
        />
      </BarChart>
    </ChartContainer>
  );
}
