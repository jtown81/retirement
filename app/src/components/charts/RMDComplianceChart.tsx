import { memo, useMemo } from 'react';
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useChart } from './ChartContext';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { RMDDataPoint } from './chart-types';
import type { ChartContextValue } from './ChartContext';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface RMDTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RMDDataPoint;
  }>;
  theme: ChartContextValue['theme'];
}

function RMDTooltip({ active, payload, theme }: RMDTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  const shortfall = Math.max(0, d.rmdRequired - d.actualWithdrawal);

  return (
    <ChartTooltip>
      <p className="font-medium">{d.year} (Age {d.age})</p>
      <p style={{ color: theme.rmdRequired }}>RMD Required: {USD_FORMAT.format(d.rmdRequired)}</p>
      <p style={{ color: theme.income }}>Actual Withdrawal: {USD_FORMAT.format(d.actualWithdrawal)}</p>
      {shortfall > 0 && (
        <p style={{ color: theme.expenses }} className="font-medium">
          Shortfall: {USD_FORMAT.format(shortfall)} ✗
        </p>
      )}
      {shortfall === 0 && (
        <p style={{ color: theme.income }} className="font-medium">
          RMD Satisfied ✓
        </p>
      )}
      <p className="text-xs mt-1" style={{ color: theme.textColor }}>
        TSP Balance: {USD_FORMAT.format(d.totalTSPBalance)}
      </p>
    </ChartTooltip>
  );
}

export interface RMDComplianceChartProps {
  data: RMDDataPoint[];
}

function RMDComplianceChartComponent({ data }: RMDComplianceChartProps) {
  const { theme, fontConfig } = useChart();

  if (data.length === 0) {
    return (
      <ChartContainer
        title="RMD Compliance (Age 73+)"
        subtitle="Required Minimum Distributions tracking"
      >
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center h-[250px] lg:h-[350px] text-muted-foreground"
        >
          No RMD data. Reach age 73 in your retirement projection to view RMD requirements.
        </div>
      </ChartContainer>
    );
  }

  // Count RMD failures
  const { failures, subtitle } = useMemo(
    () => {
      const failureCount = data.filter((d) => !d.rmdSatisfied).length;
      const message =
        failureCount > 0
          ? `${failureCount} year(s) with RMD shortfall — consider increasing withdrawals`
          : 'All RMD requirements met ✓';
      return { failures: failureCount, subtitle: message };
    },
    [data]
  );

  return (
    <ChartContainer
      title="RMD Compliance (Age 73+)"
      subtitle={subtitle}
      minHeight={350}
    >
      <ComposedChart data={data} margin={{ top: 5, right: 60, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: fontConfig.fontSize, fill: theme.textColor }}
          interval={fontConfig.interval}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: fontConfig.fontSize, fill: theme.textColor }}
          label={{ value: 'RMD / Withdrawal', angle: -90, position: 'insideLeft', fill: theme.textColor }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v: number) => `$${(v / 1000000).toFixed(1)}M`}
          tick={{ fontSize: fontConfig.fontSize, fill: theme.textColor }}
          label={{ value: 'TSP Balance', angle: 90, position: 'insideRight', fill: theme.textColor }}
        />
        <Tooltip content={<RMDTooltip theme={theme} />} />
        <Legend />

        {/* RMD Required bar (outline, red) */}
        <Bar
          yAxisId="left"
          dataKey="rmdRequired"
          fill="none"
          stroke={theme.rmdRequired}
          strokeWidth={2}
          name="RMD Required"
          isAnimationActive={false}
        />

        {/* Actual withdrawal bar (solid, green) */}
        <Bar
          yAxisId="left"
          dataKey="actualWithdrawal"
          fill={theme.income}
          name="Actual Withdrawal"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />

        {/* TSP balance line (secondary Y-axis) */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="totalTSPBalance"
          stroke={theme.textColor}
          strokeWidth={1.5}
          strokeDasharray="3 3"
          dot={false}
          name="TSP Balance"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

export const RMDComplianceChart = memo(RMDComplianceChartComponent);
