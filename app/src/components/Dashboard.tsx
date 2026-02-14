import { Alert, AlertDescription } from '@components/ui/alert';
import { Separator } from '@components/ui/separator';
import { AlertTriangle } from 'lucide-react';
import { SectionHeading } from './layout/SectionHeading';
import { SummaryPanel } from './cards/SummaryPanel';
import { MetricCardSkeleton } from './cards/MetricCardSkeleton';
import { IncomeVsExpensesChart } from './charts/IncomeVsExpensesChart';
import { PayGrowthChart } from './charts/PayGrowthChart';
import { TSPBalancesChart } from './charts/TSPBalancesChart';
import { LeaveBalancesChart } from './charts/LeaveBalancesChart';
import { ExpenseSmileCurveChart } from './charts/ExpenseSmileCurveChart';
import { ChartSkeleton } from './charts/ChartSkeleton';
import type { SimulationData } from '@hooks/useSimulation';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface DashboardProps {
  data: SimulationData | null;
  mode: 'demo' | 'user';
}

export function Dashboard({ data, mode }: DashboardProps) {
  if (!data) {
    return (
      <div className="space-y-6">
        {/* Summary Skeleton */}
        <section className="space-y-4">
          <SectionHeading
            title="Retirement Summary"
            description="Key metrics based on your plan data"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        </section>

        <Separator />

        {/* Chart Skeletons */}
        <section className="space-y-4">
          <SectionHeading
            title="Income vs. Expenses Projection"
            description="30-year retirement income and spending forecast"
          />
          <ChartSkeleton
            title="Retirement Income vs. Expenses"
            subtitle="Annual income and spending projection over your retirement horizon"
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionHeading
            title="Career Pay Growth"
            description="Salary progression from hire to retirement"
          />
          <ChartSkeleton
            title="Pay Growth Over Career"
            subtitle="Annual salary progression by grade and step"
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionHeading
            title="TSP Balance Growth"
            description="Thrift Savings Plan projected accumulation"
          />
          <ChartSkeleton
            title="TSP Balance Growth"
            subtitle="Traditional and Roth TSP projected balances"
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionHeading
            title="Leave Balances"
            description="Annual and sick leave accrual over career"
          />
          <ChartSkeleton
            title="Leave Balances"
            subtitle="Annual and sick leave accumulation over career"
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionHeading
            title="Expense Smile Curve"
            description="Expected spending pattern in retirement (Blanchett 2014)"
          />
          <ChartSkeleton
            title="Expense Smile Curve"
            subtitle="Retirement spending pattern: higher early/late, lower mid-retirement (Blanchett 2014)"
          />
        </section>
      </div>
    );
  }

  const { result, salaryHistory, leaveBalances, tspBalances, smileCurve } = data;
  const retireYear = result.projections[0]?.year;
  const year1Surplus = result.projections[0]?.surplus ?? 0;

  return (
    <div className="space-y-6">
      {mode === 'demo' && (
        <>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Showing demo data. Fill in your plan details under "My Plan" to see personalized projections.
            </AlertDescription>
          </Alert>
          <Separator />
        </>
      )}

      {/* Summary Cards */}
      <section className="space-y-4">
        <SectionHeading
          title="Retirement Summary"
          description={mode === 'demo'
            ? 'Key metrics for the GS straight-through demo scenario'
            : 'Key metrics based on your plan data'}
        />
        <SummaryPanel
          annuity={USD_FORMAT.format(result.annualAnnuity)}
          high3={USD_FORMAT.format(result.high3Salary)}
          creditableService={`${result.creditableServiceYears.toFixed(1)} yrs`}
          eligibilityType={result.eligibility.type ?? 'N/A'}
          fersSupplement={result.fersSupplementEligible ? 'Eligible' : 'Not Eligible'}
          year1Surplus={USD_FORMAT.format(year1Surplus)}
          year1SurplusVariant={year1Surplus >= 0 ? 'positive' : 'negative'}
        />
      </section>

      <Separator />

      {/* Hero Chart: Income vs Expenses */}
      <section className="space-y-4">
        <SectionHeading
          title="Income vs. Expenses Projection"
          description="30-year retirement income and spending forecast"
        />
        <IncomeVsExpensesChart data={result.projections} />
      </section>

      <Separator />

      {/* Pay Growth */}
      <section className="space-y-4">
        <SectionHeading
          title="Career Pay Growth"
          description="Salary progression from hire to retirement"
        />
        <PayGrowthChart data={salaryHistory} retirementYear={retireYear} />
      </section>

      <Separator />

      {/* TSP Balances */}
      <section className="space-y-4">
        <SectionHeading
          title="TSP Balance Growth"
          description="Thrift Savings Plan projected accumulation"
        />
        <TSPBalancesChart data={tspBalances} />
      </section>

      <Separator />

      {/* Leave Balances */}
      <section className="space-y-4">
        <SectionHeading
          title="Leave Balances"
          description="Annual and sick leave accrual over career"
        />
        <LeaveBalancesChart data={leaveBalances} />
      </section>

      <Separator />

      {/* Expense Smile Curve */}
      <section className="space-y-4">
        <SectionHeading
          title="Expense Smile Curve"
          description="Expected spending pattern in retirement (Blanchett 2014)"
        />
        <ExpenseSmileCurveChart data={smileCurve} />
      </section>
    </div>
  );
}
