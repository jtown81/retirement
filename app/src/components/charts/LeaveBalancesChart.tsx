import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import type { LeaveBalancesChartProps } from './chart-types';

function LeaveTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { year: number; annualLeaveHours: number; sickLeaveHours: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 shadow-sm text-sm">
      <p className="font-medium">{d.year}</p>
      <p className="text-blue-600">Annual: {d.annualLeaveHours.toFixed(0)} hrs</p>
      <p className="text-green-600">Sick: {d.sickLeaveHours.toFixed(0)} hrs</p>
    </div>
  );
}

export function LeaveBalancesChart({ data }: LeaveBalancesChartProps) {
  return (
    <ChartContainer
      title="Leave Balances"
      subtitle="Annual and sick leave accumulation over career"
    >
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v: number) => `${v} hrs`}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<LeaveTooltip />} />
        <ReferenceLine
          y={240}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          label={{ value: '240 hr cap', position: 'right', fontSize: 11 }}
        />
        <Area
          type="monotone"
          dataKey="annualLeaveHours"
          stroke="#2563eb"
          fill="#93c5fd"
          fillOpacity={0.4}
          name="Annual Leave"
        />
        <Area
          type="monotone"
          dataKey="sickLeaveHours"
          stroke="#16a34a"
          fill="#86efac"
          fillOpacity={0.3}
          name="Sick Leave"
        />
      </AreaChart>
    </ChartContainer>
  );
}
