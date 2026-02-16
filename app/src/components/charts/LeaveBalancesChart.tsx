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

  // Calculate sick leave retirement credit (1 month of service per 2080 sick hours)
  const sickLeaveServiceMonths = (d.sickLeaveHours / 2080) * 12;

  return (
    <ChartTooltip>
      <p className="font-medium">{d.year}</p>
      <p style={{ color: theme.plannedAnnual }}>Annual: {d.annualLeaveHours.toFixed(0)} hrs</p>
      <p style={{ color: theme.actualAnnual }}>Sick: {d.sickLeaveHours.toFixed(0)} hrs</p>
      <p className="text-xs mt-1" style={{ color: theme.textColor }}>
        Sick Leave Retirement Credit: {sickLeaveServiceMonths.toFixed(1)} months
      </p>
    </ChartTooltip>
  );
}

export function LeaveBalancesChart({ data }: LeaveBalancesChartProps) {
  const theme = useChartTheme();

  // Calculate final sick leave retirement credit
  const finalSickHours = data[data.length - 1]?.sickLeaveHours ?? 0;
  const finalSickMonths = (finalSickHours / 2080) * 12;

  return (
    <ChartContainer
      title="Leave Balances"
      subtitle={`Annual and sick leave accumulation over career (sick leave retirement credit: ${finalSickMonths.toFixed(1)} months)`}
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
          label={{ value: '240 hr carryover cap', position: 'right', fontSize: 11, fill: theme.textColor }}
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
