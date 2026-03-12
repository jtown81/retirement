import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { RothVsTraditionalChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function RothTraditionalTooltip({
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
      <p style={{ color: '#3b82f6' }}>
        Traditional: {USD_FORMAT.format(d.traditionalBalance || 0)}
      </p>
      <p style={{ color: '#10b981' }}>
        Roth: {USD_FORMAT.format(d.rothBalance || 0)}
      </p>
      {d.rmdRequired > 0 && (
        <p style={{ color: '#ef4444' }} className="text-xs mt-1">
          RMD Required: {USD_FORMAT.format(d.rmdRequired)}
        </p>
      )}
    </ChartTooltip>
  );
}

export function RothVsTraditionalChart({ data }: RothVsTraditionalChartProps) {
  const theme = useChartTheme();

  return (
    <ChartContainer
      title="Roth vs Traditional TSP Balance"
      subtitle="Growth of Roth and Traditional TSP accounts with RMD pressure indicator"
    >
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
          yAxisId="left"
        />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
          orientation="right"
          yAxisId="right"
        />
        <Tooltip content={<RothTraditionalTooltip theme={theme} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="traditionalBalance"
          fill="#3b82f6"
          stroke="#1e40af"
          fillOpacity={0.6}
          name="Traditional TSP"
          isAnimationActive={false}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="rothBalance"
          fill="#10b981"
          stroke="#059669"
          fillOpacity={0.6}
          name="Roth TSP"
          isAnimationActive={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="rmdRequired"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          name="RMD Required"
          isAnimationActive={false}
          connectNulls={true}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
