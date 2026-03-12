/**
 * Social Security Claiming Age Comparison Chart
 *
 * Shows cumulative lifetime Social Security benefits at different claiming ages
 * (62, FRA, 70) to help users understand the impact of delaying benefits.
 *
 * Purpose: The SS claiming age is one of the single most impactful retirement
 * decisions. Claiming at 62 vs 70 can be a 77% difference in lifetime benefits
 * depending on longevity assumptions.
 *
 * Data Points:
 * - Claiming at 62: reduced benefits (~70% of PIA)
 * - Claiming at FRA: full benefits (100% of PIA)
 * - Claiming at 70: maximum benefits (~124% of PIA, with DRC)
 *
 * Shows:
 * - Monthly benefit amount at each claiming age
 * - Cumulative lifetime benefits through age 95
 * - Break-even ages (when delayed claiming pays off)
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface SSComparisonDataPoint {
  age: number;
  cumulativeAt62: number;
  cumulativeAtFRA: number;
  cumulativeAt70: number;
}

function SSComparisonTooltip({
  active,
  payload,
  theme,
}: {
  active?: boolean;
  payload?: Array<{ payload: SSComparisonDataPoint }>;
  theme: ReturnType<typeof useChartTheme>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  return (
    <ChartTooltip>
      <p className="font-medium">Age {d.age}</p>
      <p style={{ color: '#f87171' }}>Claim at 62: {USD_FORMAT.format(d.cumulativeAt62)}</p>
      <p style={{ color: theme.income }}>Claim at FRA: {USD_FORMAT.format(d.cumulativeAtFRA)}</p>
      <p style={{ color: '#34d399' }}>Claim at 70: {USD_FORMAT.format(d.cumulativeAt70)}</p>
    </ChartTooltip>
  );
}

export interface SSClaimingComparisonChartProps {
  monthlyBenefit62: number;
  monthlyBenefitFRA: number;
  monthlyBenefit70: number;
  fullRetirementAge: number;
  retirementAge: number;
  maxAge?: number;
}

/**
 * Prepare chart data: cumulative benefits for each claiming strategy
 * from current age through maxAge (default 95).
 */
function prepareChartData({
  monthlyBenefit62,
  monthlyBenefitFRA,
  monthlyBenefit70,
  fullRetirementAge,
  retirementAge,
  maxAge = 95,
}: SSClaimingComparisonChartProps): SSComparisonDataPoint[] {
  const data: SSComparisonDataPoint[] = [];

  for (let age = retirementAge; age <= maxAge; age++) {
    let cumulativeAt62 = 0;
    let cumulativeAtFRA = 0;
    let cumulativeAt70 = 0;

    // Strategy 1: Claim at 62
    const yearsClaimedAt62 = age - 62;
    if (yearsClaimedAt62 > 0) {
      cumulativeAt62 = monthlyBenefit62 * 12 * yearsClaimedAt62;
    }

    // Strategy 2: Claim at FRA
    const yearsClaimedAtFRA = age - fullRetirementAge;
    if (yearsClaimedAtFRA > 0) {
      cumulativeAtFRA = monthlyBenefitFRA * 12 * yearsClaimedAtFRA;
    }

    // Strategy 3: Claim at 70
    const yearsClaimedAt70 = age - 70;
    if (yearsClaimedAt70 > 0) {
      cumulativeAt70 = monthlyBenefit70 * 12 * yearsClaimedAt70;
    }

    data.push({
      age,
      cumulativeAt62,
      cumulativeAtFRA,
      cumulativeAt70,
    });
  }

  return data;
}

export function SSClaimingComparisonChart(props: SSClaimingComparisonChartProps) {
  const theme = useChartTheme();
  const data = prepareChartData(props);

  // Calculate break-even ages for context
  const maxAge = Math.max(...data.map((d) => d.age));
  const fra70BreakEven = data.find((d) => d.cumulativeAt70 >= d.cumulativeAtFRA)?.age ?? maxAge;
  const at6270BreakEven = data.find((d) => d.cumulativeAt70 >= d.cumulativeAt62)?.age ?? maxAge;

  return (
    <ChartContainer
      title="Social Security Claiming Age Comparison"
      subtitle={`Cumulative lifetime benefits: Claim early (age 62) vs full retirement age (${props.fullRetirementAge}) vs maximum (age 70)`}
    >
      <div className="space-y-4">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
          <XAxis dataKey="age" tick={{ fontSize: 12, fill: theme.textColor }} />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12, fill: theme.textColor }}
          />
          <Tooltip content={<SSComparisonTooltip theme={theme} />} />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />

          {/* Claim at 62: reduced (70% of PIA) */}
          <Line
            type="monotone"
            dataKey="cumulativeAt62"
            stroke="#f87171"
            strokeWidth={2}
            dot={false}
            name={`Claim at 62 (Reduced ${(62 / props.fullRetirementAge * 100).toFixed(0)}%)`}
          />

          {/* Claim at FRA: full benefits */}
          <Line
            type="monotone"
            dataKey="cumulativeAtFRA"
            stroke={theme.income}
            strokeWidth={2}
            dot={false}
            name={`Claim at ${props.fullRetirementAge} (Full 100%)`}
          />

          {/* Claim at 70: maximum with DRC */}
          <Line
            type="monotone"
            dataKey="cumulativeAt70"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            name="Claim at 70 (Maximum +DRC)"
          />

          {/* Mark break-even ages */}
          {fra70BreakEven <= maxAge && (
            <ReferenceLine
              x={fra70BreakEven}
              stroke={theme.borderColor}
              strokeDasharray="5 5"
              label={{
                value: `FRA/70 breakeven: ${fra70BreakEven}`,
                position: 'top',
                fontSize: 11,
                fill: theme.textColor,
              }}
            />
          )}
        </LineChart>

        {/* Break-even summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div className="p-2 rounded bg-red-50 dark:bg-red-950">
            <p className="font-medium text-red-700 dark:text-red-300">Claim at 62</p>
            <p className="text-red-600 dark:text-red-400">Monthly: {USD_FORMAT.format(props.monthlyBenefit62)}</p>
          </div>
          <div className="p-2 rounded bg-blue-50 dark:bg-blue-950">
            <p className="font-medium text-blue-700 dark:text-blue-300">Claim at {props.fullRetirementAge} (FRA)</p>
            <p className="text-blue-600 dark:text-blue-400">Monthly: {USD_FORMAT.format(props.monthlyBenefitFRA)}</p>
          </div>
          <div className="p-2 rounded bg-green-50 dark:bg-green-950">
            <p className="font-medium text-green-700 dark:text-green-300">Claim at 70</p>
            <p className="text-green-600 dark:text-green-400">Monthly: {USD_FORMAT.format(props.monthlyBenefit70)}</p>
          </div>
        </div>

        <p className="text-xs text-text-secondary italic">
          Break-even: Waiting until 70 vs {props.fullRetirementAge} pays off around age {fra70BreakEven}.
          {props.fullRetirementAge !== 62 && ` Waiting until 70 vs 62 pays off around age ${at6270BreakEven}.`}
        </p>
      </div>
    </ChartContainer>
  );
}
