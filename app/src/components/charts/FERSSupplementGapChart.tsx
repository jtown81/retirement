import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { FERSSupplementGapChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function SupplementGapTooltip({
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
      <p style={{ color: '#3b82f6' }}>Annuity: {USD_FORMAT.format(d.annuity || 0)}</p>
      {d.fersSupplement > 0 && (
        <p style={{ color: '#f59e0b' }}>
          FERS Supplement: {USD_FORMAT.format(d.fersSupplement)}
        </p>
      )}
      {d.socialSecurity > 0 && (
        <p style={{ color: '#10b981' }}>
          Social Security: {USD_FORMAT.format(d.socialSecurity)}
        </p>
      )}
      {d.tspWithdrawal > 0 && (
        <p style={{ color: '#a855f7' }}>
          TSP Withdrawal: {USD_FORMAT.format(d.tspWithdrawal)}
        </p>
      )}
    </ChartTooltip>
  );
}

export function FERSSupplementGapChart({ data }: FERSSupplementGapChartProps) {
  const theme = useChartTheme();

  return (
    <ChartContainer
      title="Income Sources Over Time"
      subtitle="Shows when FERS supplement ends and when Social Security begins"
    >
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<SupplementGapTooltip theme={theme} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="annuity"
          stackId="1"
          fill="#3b82f6"
          stroke="none"
          fillOpacity={0.7}
          name="FERS Annuity"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="fersSupplement"
          stackId="1"
          fill="#f59e0b"
          stroke="none"
          fillOpacity={0.7}
          name="FERS Supplement"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="socialSecurity"
          stackId="1"
          fill="#10b981"
          stroke="none"
          fillOpacity={0.7}
          name="Social Security"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="tspWithdrawal"
          stackId="1"
          fill="#a855f7"
          stroke="none"
          fillOpacity={0.7}
          name="TSP Withdrawal"
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
