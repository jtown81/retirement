import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import type { PayGrowthChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function PayTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { year: number; salary: number; grade: number; step: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded px-3 py-2 shadow-sm text-sm">
      <p className="font-medium">{d.year}</p>
      <p className="text-blue-600">{USD_FORMAT.format(d.salary)}</p>
      <p className="text-gray-500">GS-{d.grade} Step {d.step}</p>
    </div>
  );
}

export function PayGrowthChart({ data, retirementYear }: PayGrowthChartProps) {
  return (
    <ChartContainer
      title="Pay Growth Over Career"
      subtitle="Annual salary progression by grade and step"
    >
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<PayTooltip />} />
        <Line
          type="stepAfter"
          dataKey="salary"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
        />
        {retirementYear && (
          <ReferenceLine
            x={retirementYear}
            stroke="#dc2626"
            strokeDasharray="4 4"
            label={{ value: 'Retire', position: 'top', fontSize: 12 }}
          />
        )}
      </LineChart>
    </ChartContainer>
  );
}
