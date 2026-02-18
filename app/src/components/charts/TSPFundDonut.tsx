import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './ChartContainer';
import type { TSPAccountSnapshot } from '@models/tsp';

const FUND_COLORS: Record<string, string> = {
  'G': '#3B82F6',      // blue
  'F': '#8B5CF6',      // violet
  'C': '#EC4899',      // pink
  'S': '#F59E0B',      // amber
  'I': '#10B981',      // emerald
  'L-Income': '#6366F1', // indigo
  'L2025': '#0EA5E9',  // cyan
  'L2030': '#06B6D4',  // cyan-600
  'L2035': '#14B8A6',  // teal
  'L2040': '#84CC16',  // lime
  'L2045': '#EAB308',  // yellow
  'L2050': '#F97316',  // orange
  'L2055': '#DC2626',  // red
  'L2060': '#7C3AED',  // violet-600
  'L2065': '#DB2777',  // rose
};

interface TSPFundDonutProps {
  snapshot: TSPAccountSnapshot | null;
}

export function TSPFundDonut({ snapshot }: TSPFundDonutProps) {
  if (!snapshot || snapshot.fundAllocations.length === 0) {
    return (
      <ChartContainer title="Fund Allocation" subtitle="Latest snapshot">
        <div className="flex items-center justify-center h-80 text-muted-foreground text-sm">
          No fund allocations recorded
        </div>
      </ChartContainer>
    );
  }

  // Prepare data: sum Traditional + Roth for each fund
  const data = snapshot.fundAllocations
    .filter(fa => fa.percentTraditional + fa.percentRoth > 0)
    .map(fa => ({
      name: fa.fund,
      value: fa.percentTraditional + fa.percentRoth,
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <ChartContainer title="Fund Allocation" subtitle="Latest snapshot">
        <div className="flex items-center justify-center h-80 text-muted-foreground text-sm">
          No fund allocations recorded
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer title="Fund Allocation" subtitle={`As of ${snapshot.asOf}`}>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name} ${value.toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={FUND_COLORS[entry.name] || '#999'}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${(value as number).toFixed(1)}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
