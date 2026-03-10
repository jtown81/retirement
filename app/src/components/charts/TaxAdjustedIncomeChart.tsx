/**
 * Tax-Adjusted Income Waterfall Chart
 *
 * Shows gross income stacked by source (annuity, supplement, SS, TSP),
 * with a line overlay showing actual after-tax income.
 *
 * Purpose: Help users understand tax impact on retirement income.
 * Most important missing visualization — gross income alone is misleading.
 *
 * Stacks:
 * - Annuity (FERS, base)
 * - FERS Supplement (age <62)
 * - Social Security
 * - TSP Withdrawal (Traditional + Roth combined)
 *
 * Overlay: After-Tax Income line (what they actually keep)
 */

import {
  ComposedChart,
  Bar,
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
import type { SimulationYearResult } from '@models/simulation';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface TaxAdjustedIncomeChartDataPoint {
  year: number;
  age: number;
  annuity: number;
  fersSupplement: number;
  socialSecurity: number;
  tspWithdrawal: number;
  grossIncome: number;
  totalTax: number;
  afterTaxIncome: number;
  effectiveTaxRate: number;
}

function TaxAdjustedTooltip({
  active,
  payload,
  theme,
}: {
  active?: boolean;
  payload?: Array<{
    payload: TaxAdjustedIncomeChartDataPoint;
  }>;
  theme: ReturnType<typeof useChartTheme>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  return (
    <ChartTooltip>
      <p className="font-medium">{d.year} (Age {d.age})</p>
      <p className="text-sm">
        <strong>Gross Income:</strong> {USD_FORMAT.format(d.grossIncome)}
      </p>
      <div className="text-sm mt-1 space-y-0.5 border-t border-current pt-1">
        <p>• Annuity: {USD_FORMAT.format(d.annuity)}</p>
        {d.fersSupplement > 0 && <p>• Supplement: {USD_FORMAT.format(d.fersSupplement)}</p>}
        {d.socialSecurity > 0 && <p>• Social Security: {USD_FORMAT.format(d.socialSecurity)}</p>}
        {d.tspWithdrawal > 0 && <p>• TSP Withdrawal: {USD_FORMAT.format(d.tspWithdrawal)}</p>}
      </div>
      <p className="text-sm border-t border-current pt-1 mt-1">
        <strong>Federal Tax + IRMAA:</strong> {USD_FORMAT.format(d.totalTax)} ({(d.effectiveTaxRate * 100).toFixed(1)}%)
      </p>
      <p style={{ color: theme.income }} className="font-medium mt-1">
        After-Tax Income: {USD_FORMAT.format(d.afterTaxIncome)}
      </p>
    </ChartTooltip>
  );
}

export interface TaxAdjustedIncomeChartProps {
  data: SimulationYearResult[];
}

/**
 * Prepare chart data from simulation results.
 * Filters out years with $0 gross income (pre-retirement).
 */
function prepareChartData(years: SimulationYearResult[]): TaxAdjustedIncomeChartDataPoint[] {
  return years
    .filter((y) => y.totalIncome > 0)
    .map((y) => ({
      year: y.year,
      age: y.age,
      annuity: y.annuity,
      fersSupplement: y.fersSupplement,
      socialSecurity: y.socialSecurity,
      tspWithdrawal: y.tspWithdrawal,
      grossIncome: y.totalIncome,
      totalTax: y.totalTax ?? 0,
      afterTaxIncome: y.afterTaxSurplus !== undefined ? y.totalIncome - (y.totalTax ?? 0) : y.totalIncome,
      effectiveTaxRate: y.effectiveTaxRate ?? 0,
    }));
}

export function TaxAdjustedIncomeChart({ data }: TaxAdjustedIncomeChartProps) {
  const theme = useChartTheme();
  const chartData = prepareChartData(data);

  if (chartData.length === 0) {
    return (
      <ChartContainer
        title="Tax-Adjusted Income"
        subtitle="Breakdown of gross income by source with federal tax and IRMAA impact"
      >
        <div className="h-[300px] flex items-center justify-center text-text-secondary">
          No data available
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      title="Tax-Adjusted Income"
      subtitle="Breakdown of gross income by source with federal tax and IRMAA impact"
    >
      <ComposedChart data={chartData} margin={{ top: 5, right: 40, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          yAxisId="left"
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
          label={{ value: 'Income', angle: -90, position: 'insideLeft' }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
          label={{ value: 'After-Tax', angle: 90, position: 'insideRight' }}
        />
        <Tooltip content={<TaxAdjustedTooltip theme={theme} />} />
        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
        <ReferenceLine y={0} stroke={theme.borderColor} />

        {/* Stacked income bars by source */}
        <Bar dataKey="annuity" stackId="income" fill={theme.income} name="Annuity" yAxisId="left" />
        <Bar dataKey="fersSupplement" stackId="income" fill="#60a5fa" name="FERS Supplement" yAxisId="left" />
        <Bar dataKey="socialSecurity" stackId="income" fill="#34d399" name="Social Security" yAxisId="left" />
        <Bar dataKey="tspWithdrawal" stackId="income" fill="#fbbf24" name="TSP Withdrawal" yAxisId="left" />

        {/* After-tax income line: the most important metric */}
        <Line
          type="monotone"
          dataKey="afterTaxIncome"
          stroke={theme.income}
          strokeWidth={3}
          dot={false}
          name="After-Tax Income"
          yAxisId="right"
        />
      </ComposedChart>
    </ChartContainer>
  );
}
