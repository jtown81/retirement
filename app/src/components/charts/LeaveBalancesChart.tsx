import {
  AreaChart,
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
import type { LeaveBalancesChartProps } from './chart-types';

function LeaveTooltip({ active, payload, theme }: { active?: boolean; payload?: Array<{ payload: { year: number; annualLeaveHours: number; sickLeaveHours: number } }>; theme: ReturnType<typeof useChartTheme> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <ChartTooltip>
      <p className="font-medium">{d.year}</p>
      <p style={{ color: theme.plannedAnnual }}>Annual: {d.annualLeaveHours.toFixed(0)} hrs</p>
      <p style={{ color: theme.actualAnnual }}>Sick: {d.sickLeaveHours.toFixed(0)} hrs</p>
    </ChartTooltip>
  );
}

export function LeaveBalancesChart({ data }: LeaveBalancesChartProps) {
  const theme = useChartTheme();

  return (
    <ChartContainer
      title="Leave Balances"
      subtitle="Annual and sick leave accumulation over career"
    >
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `${v} hrs`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<LeaveTooltip theme={theme} />} />
        <ReferenceLine
          y={240}
          stroke={theme.holiday}
          strokeDasharray="4 4"
          label={{ value: '240 hr cap', position: 'right', fontSize: 11, fill: theme.textColor }}
        />
        <Area
          type="monotone"
          dataKey="annualLeaveHours"
          stroke={theme.plannedAnnual}
          fill={theme.plannedAnnual}
          fillOpacity={0.4}
          name="Annual Leave"
        />
        <Area
          type="monotone"
          dataKey="sickLeaveHours"
          stroke={theme.actualAnnual}
          fill={theme.actualAnnual}
          fillOpacity={0.3}
          name="Sick Leave"
        />
      </AreaChart>
    </ChartContainer>
  );
}
