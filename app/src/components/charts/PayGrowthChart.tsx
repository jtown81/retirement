import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { useChartTheme } from '@hooks/useChartTheme';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import type { PayGrowthChartProps, PayGrowthDataPoint } from './chart-types';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function PayTooltip({ active, payload, theme, isHigh3 }: { active?: boolean; payload?: Array<{ payload: PayGrowthDataPoint }>; theme: ReturnType<typeof useChartTheme>; isHigh3?: boolean }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <ChartTooltip>
      <p className="font-medium">{d.year}{isHigh3 ? ' (High-3)' : ''}</p>
      <p style={{ color: theme.salary }}>
        {USD_FORMAT.format(d.salary)}
      </p>
      <p className="text-muted-foreground">GS-{d.grade} Step {d.step}</p>
    </ChartTooltip>
  );
}

export function PayGrowthChart({ data, retirementYear }: PayGrowthChartProps) {
  const theme = useChartTheme();

  // Calculate High-3 average (3 highest consecutive annual salaries)
  const high3Salary = (() => {
    let maxAvg = 0;
    let high3Years: PayGrowthDataPoint[] = [];

    for (let i = 0; i <= data.length - 3; i++) {
      const avg = (data[i].salary + data[i + 1].salary + data[i + 2].salary) / 3;
      if (avg > maxAvg) {
        maxAvg = avg;
        high3Years = [data[i], data[i + 1], data[i + 2]];
      }
    }

    return { avgSalary: maxAvg, years: high3Years };
  })();

  // Create highlights for High-3 years
  const high3YearSet = new Set(high3Salary.years.map((d) => d.year));

  return (
    <ChartContainer
      title="Pay Growth Over Career"
      subtitle="Annual salary progression by grade and step (shaded region shows High-3 average)"
    >
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: theme.textColor }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: theme.textColor }}
        />
        <Tooltip content={<PayTooltip theme={theme} isHigh3={false} />} />

        {/* High-3 region background reference lines */}
        {high3Salary.years.length > 0 && high3Salary.years[0] && (
          <>
            <ReferenceLine
              x={high3Salary.years[0].year}
              stroke={theme.surplus}
              strokeDasharray="2 2"
              opacity={0.3}
            />
            <ReferenceLine
              x={high3Salary.years[high3Salary.years.length - 1].year}
              stroke={theme.surplus}
              strokeDasharray="2 2"
              opacity={0.3}
            />
          </>
        )}

        {/* Salary line */}
        <Line
          type="stepAfter"
          dataKey="salary"
          stroke={theme.salary}
          strokeWidth={2}
          dot={false}
          name="Salary"
        />

        {/* High-3 average reference line */}
        {high3Salary.avgSalary > 0 && (
          <ReferenceLine
            y={high3Salary.avgSalary}
            stroke={theme.surplus}
            strokeDasharray="5 5"
            label={{
              value: `High-3: ${USD_FORMAT.format(high3Salary.avgSalary)}`,
              position: 'right',
              fontSize: 11,
              fill: theme.textColor,
            }}
          />
        )}

        {/* Retirement year marker */}
        {retirementYear && (
          <ReferenceLine
            x={retirementYear}
            stroke={theme.expenses}
            strokeDasharray="4 4"
            label={{ value: 'Retire', position: 'top', fontSize: 12, fill: theme.textColor }}
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
