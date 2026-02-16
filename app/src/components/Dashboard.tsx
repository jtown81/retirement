import { Alert, AlertDescription } from '@components/ui/alert';
import { Separator } from '@components/ui/separator';
import { AlertTriangle } from 'lucide-react';
import { SectionHeading } from './layout/SectionHeading';
import { SummaryPanel } from './cards/SummaryPanel';
import { MetricCardSkeleton } from './cards/MetricCardSkeleton';
import { IncomeWaterfallChart } from './charts/IncomeWaterfallChart';
import { PayGrowthChart } from './charts/PayGrowthChart';
import { TSPLifecycleChart } from './charts/TSPLifecycleChart';
import { LeaveBalancesChart } from './charts/LeaveBalancesChart';
import { ExpensePhasesChart } from './charts/ExpensePhasesChart';
import { RMDComplianceChart } from './charts/RMDComplianceChart';
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

  const {
    result,
    salaryHistory,
    leaveBalances,
    tspBalances,
    smileCurve,
    fullSimulation,
    incomeWaterfall,
    tspLifecycle,
    expensePhases,
    rmdTimeline,
  } = data;
  const retireYear = result.projections[0]?.year;
  const year1Surplus = result.projections[0]?.surplus ?? 0;

  // Compute summary card values
  const socialSecurityEstimate = fullSimulation
    ? USD_FORMAT.format(
        fullSimulation.config.ssMonthlyAt62 * 12 *
          (fullSimulation.config.ssClaimingAge === 70
            ? 1.24
            : fullSimulation.config.ssClaimingAge === 67
              ? 1.0
              : 0.7)
      )
    : undefined;

  const tspDepletionAge = fullSimulation
    ? fullSimulation.depletionAge !== null
      ? `Age ${fullSimulation.depletionAge}`
      : `Survives to ${fullSimulation.config.endAge}`
    : undefined;

  const tspDepletionVariant =
    fullSimulation && fullSimulation.depletionAge !== null
      ? fullSimulation.depletionAge > 85
        ? 'positive'
        : 'negative'
      : fullSimulation
        ? 'positive'
        : 'default';

  const lifetimeNetResult = fullSimulation
    ? fullSimulation.totalLifetimeIncome - fullSimulation.totalLifetimeExpenses
    : undefined;

  const lifetimeSurplus = lifetimeNetResult !== undefined ? USD_FORMAT.format(lifetimeNetResult) : undefined;
  const lifetimeSurplusVariant = lifetimeNetResult !== undefined ? (lifetimeNetResult >= 0 ? 'positive' : 'negative') : 'default';

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
          socialSecurityEstimate={socialSecurityEstimate}
          tspDepletionAge={tspDepletionAge}
          tspDepletionVariant={tspDepletionVariant}
          lifetimeSurplus={lifetimeSurplus}
          lifetimeSurplusVariant={lifetimeSurplusVariant}
        />
      </section>

      <Separator />

      {/* Hero Chart: Income Waterfall */}
      <section className="space-y-4">
        <SectionHeading
          title="Retirement Income Waterfall"
          description="Annual income sources and spending projection over 30-year retirement"
        />
        <IncomeWaterfallChart data={incomeWaterfall} />
      </section>

      <Separator />

      {/* TSP Lifecycle */}
      <section className="space-y-4">
        <SectionHeading
          title="TSP Balance Lifecycle"
          description="Traditional and Roth TSP from accumulation through retirement drawdown"
        />
        <TSPLifecycleChart data={tspLifecycle} retirementYear={retireYear} />
      </section>

      <Separator />

      {/* Pay Growth */}
      <section className="space-y-4">
        <SectionHeading
          title="Career Pay Growth"
          description="Salary progression from hire to retirement with High-3 average highlighted"
        />
        <PayGrowthChart data={salaryHistory} retirementYear={retireYear} />
      </section>

      <Separator />

      {/* Leave Balances */}
      <section className="space-y-4">
        <SectionHeading
          title="Leave Balances"
          description="Annual and sick leave accrual over career with retirement credit calculation"
        />
        <LeaveBalancesChart data={leaveBalances} />
      </section>

      <Separator />

      {/* Expense Phases */}
      <section className="space-y-4">
        <SectionHeading
          title="Retirement Expense Phases"
          description="Expected spending pattern: GoGo (active), GoSlow (moderate), NoGo (reduced)"
        />
        <ExpensePhasesChart data={expensePhases} />
      </section>

      {/* RMD Compliance (only show if applicable) */}
      {rmdTimeline.length > 0 && (
        <>
          <Separator />

          <section className="space-y-4">
            <SectionHeading
              title="RMD Compliance Timeline"
              description="Required Minimum Distribution tracking from age 73 forward"
            />
            <RMDComplianceChart data={rmdTimeline} />
          </section>
        </>
      )}
    </div>
  );
}
