import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import { computeFERSAnnuity } from '@modules/simulation';
import type { AnnuitySensitivityChartProps } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function AnnuitySensitivityTooltip({
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

  return (
    <ChartTooltip>
      <p className="font-medium">Age {d.age}</p>
      <p style={{ color: '#3b82f6' }}>
        Annuity: {USD_FORMAT.format(d.annuity || 0)}
      </p>
      {d.isPlanned && <p className="text-xs text-amber-600 font-medium">Planned age</p>}
    </ChartTooltip>
  );
}

export function AnnuitySensitivityChart({
  high3Salary,
  creditableServiceAtCurrentAge,
  currentAge,
  survivorBenefitOption,
}: AnnuitySensitivityChartProps) {
  const theme = useChartTheme();

  // Estimate likely retirement age (typically 55-62)
  const plannedRetirementAge = Math.max(56, Math.min(62, currentAge + 5));

  // Generate sensitivity data from -3 to +5 years around planned age
  const data = Array.from({ length: 9 }).map((_, i) => {
    const ageOffset = i - 3; // -3 to +5
    const retirementAge = plannedRetirementAge + ageOffset;
    const yearsOfService = creditableServiceAtCurrentAge + ageOffset;

    // Only calculate valid ages
    if (retirementAge < 50 || yearsOfService < 0) {
      return {
        age: retirementAge,
        annuity: 0,
        isPlanned: false,
      };
    }

    const result = computeFERSAnnuity(
      high3Salary,
      yearsOfService,
      retirementAge,
      'MRA+30', // Default eligibility type
      survivorBenefitOption,
    );

    return {
      age: retirementAge,
      annuity: result.netAnnualAnnuity,
      isPlanned: retirementAge === plannedRetirementAge,
    };
  });

  return (
    <ChartContainer
      title="Annuity Sensitivity Analysis"
      subtitle="How annuity changes with different retirement ages"
    >
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          dataKey="age"
          label={{ value: 'Retirement Age', position: 'insideBottomRight', offset: -5 }}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<AnnuitySensitivityTooltip theme={theme} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="annuity"
          fill="#3b82f6"
          name="Annual Annuity"
        />
      </BarChart>
    </ChartContainer>
  );
}
