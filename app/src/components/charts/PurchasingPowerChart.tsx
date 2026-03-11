import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { PurchasingPowerChartProps } from './chart-types';

function PurchasingPowerTooltip({
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
      <p className="font-medium">Year {d.year}</p>
      <p style={{ color: '#10b981' }}>
        Annuity (COLA): {pctFormat.format(d.colaAdjusted)}%
      </p>
      <p style={{ color: '#ef4444' }}>
        Inflation Erosion: {pctFormat.format(d.inflationErosion)}%
      </p>
    </ChartTooltip>
  );
}

export function PurchasingPowerChart({
  inflationRate,
  colaRate,
  years,
}: PurchasingPowerChartProps) {
  const theme = useChartTheme();

  // Generate data showing purchasing power over time
  const data = Array.from({ length: years }).map((_, i) => {
    const year = i + 1;
    const colaAdjusted = Math.pow(1 + colaRate, year - 1) * 100;
    const inflationErosion = Math.pow(1 + inflationRate, year - 1) * 100;

    return {
      year,
      colaAdjusted,
      inflationErosion,
    };
  });

  return (
    <ChartContainer
      title="Purchasing Power Analysis"
      subtitle="Annuity growth (COLA-adjusted) vs general inflation erosion"
    >
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          dataKey="year"
          label={{ value: 'Years into Retirement', position: 'insideBottomRight', offset: -5 }}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <YAxis
          label={{ value: 'Purchasing Power (%)', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<PurchasingPowerTooltip theme={theme} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="colaAdjusted"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="Annuity (COLA-Adjusted)"
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="inflationErosion"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          name="Inflation Impact"
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
