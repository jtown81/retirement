import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Line,
  ComposedChart,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { useResponsiveChartFontSize } from '@hooks/useResponsiveChartFontSize';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { TSPLifecycleDataPoint } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface TSPLifecycleTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TSPLifecycleDataPoint;
  }>;
  theme: ReturnType<typeof useChartTheme>;
}

function TSPLifecycleTooltip({ active, payload, theme }: TSPLifecycleTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  return (
    <ChartTooltip>
      <p className="font-medium">{d.year}{d.age ? ` (Age ${d.age})` : ''}</p>
      <p style={{ color: theme.traditional }}>Traditional: {USD_FORMAT.format(d.traditionalBalance)}</p>
      <p style={{ color: theme.roth }}>Roth: {USD_FORMAT.format(d.rothBalance)}</p>
      <p className="font-medium" style={{ color: theme.textColor }}>
        Total: {USD_FORMAT.format(d.totalBalance)}
      </p>
      {d.phase === 'distribution' && (
        <>
          {d.highRiskBalance !== undefined && (
            <p style={{ color: theme.highRisk }}>High-Risk: {USD_FORMAT.format(d.highRiskBalance)}</p>
          )}
          {d.lowRiskBalance !== undefined && (
            <p style={{ color: theme.lowRisk }}>Low-Risk: {USD_FORMAT.format(d.lowRiskBalance)}</p>
          )}
          {d.withdrawal !== undefined && (
            <p style={{ color: theme.expenses }}>Withdrawal: {USD_FORMAT.format(d.withdrawal)}</p>
          )}
          {d.rmdRequired !== undefined && (
            <p style={{ color: d.rmdSatisfied ? theme.income : theme.expenses }}>
              RMD: {USD_FORMAT.format(d.rmdRequired)} {d.rmdSatisfied ? '✓' : '✗'}
            </p>
          )}
        </>
      )}
    </ChartTooltip>
  );
}

export interface TSPLifecycleChartProps {
  data: TSPLifecycleDataPoint[];
  retirementYear?: number;
}

export function TSPLifecycleChart({ data, retirementYear }: TSPLifecycleChartProps) {
  const theme = useChartTheme();
  const fontConfig = useResponsiveChartFontSize();

  // Find depletion year (balance drops to near 0)
  const depletionYear = data.find((d) => d.totalBalance < 1000)?.year ?? null;

  return (
    <ChartContainer
      title="TSP Balance Lifecycle"
      subtitle="Traditional and Roth TSP from accumulation through retirement drawdown"
      minHeight={400}
    >
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: fontConfig.fontSize, fill: theme.textColor }} interval={fontConfig.interval} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000000).toFixed(1)}M`}
          tick={{ fontSize: fontConfig.fontSize, fill: theme.textColor }}
        />
        <Tooltip content={<TSPLifecycleTooltip theme={theme} />} />

        {/* Retirement transition line */}
        {retirementYear && (
          <ReferenceLine
            x={retirementYear}
            stroke={theme.borderColor}
            strokeDasharray="5 5"
            label={{ value: 'Retirement', position: 'top', fill: theme.textColor, fontSize: 12 }}
          />
        )}

        {/* Depletion line if exists */}
        {depletionYear && (
          <ReferenceLine
            x={depletionYear}
            stroke={theme.expenses}
            strokeDasharray="3 3"
            label={{ value: `Depleted: ${depletionYear}`, position: 'top', fill: theme.expenses, fontSize: 12 }}
          />
        )}

        {/* Traditional TSP area */}
        <Area
          type="monotone"
          dataKey="traditionalBalance"
          stackId="tsp"
          fill={theme.traditional}
          stroke={theme.traditional}
          fillOpacity={0.6}
          name="Traditional"
        />

        {/* Roth TSP area */}
        <Area
          type="monotone"
          dataKey="rothBalance"
          stackId="tsp"
          fill={theme.roth}
          stroke={theme.roth}
          fillOpacity={0.6}
          name="Roth"
        />

        {/* High-risk balance overlay line (post-retirement) */}
        {data.some((d) => d.highRiskBalance !== undefined) && (
          <Line
            type="monotone"
            dataKey="highRiskBalance"
            stroke={theme.highRisk}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
            name="High-Risk Allocation"
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
