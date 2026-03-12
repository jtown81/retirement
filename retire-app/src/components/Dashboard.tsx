import { Alert, AlertDescription } from '@components/ui/alert';
import { Separator } from '@components/ui/separator';
import { AlertTriangle } from 'lucide-react';
import { SectionHeading } from './layout/SectionHeading';
import { SummaryPanel } from './cards/SummaryPanel';
import { MetricCardSkeleton } from './cards/MetricCardSkeleton';
import { IncomeVsExpensesChart } from './charts/IncomeVsExpensesChart';
import { TaxAdjustedIncomeChart } from './charts/TaxAdjustedIncomeChart';
import { SSClaimingComparisonChart } from './charts/SSClaimingComparisonChart';
import { PayGrowthChart } from './charts/PayGrowthChart';
import { TSPBalancesChart } from './charts/TSPBalancesChart';
import { LeaveBalancesChart } from './charts/LeaveBalancesChart';
import { ExpenseSmileCurveChart } from './charts/ExpenseSmileCurveChart';
import { CollapsibleChartSection } from './charts/CollapsibleChartSection';
import { FERSSupplementGapChart } from './charts/FERSSupplementGapChart';
import { NetCashFlowChart } from './charts/NetCashFlowChart';
import { RothVsTraditionalChart } from './charts/RothVsTraditionalChart';
import { ReplacementRatioChart } from './charts/ReplacementRatioChart';
import { PurchasingPowerChart } from './charts/PurchasingPowerChart';
import { HealthcareCostChart } from './charts/HealthcareCostChart';
import { AnnuitySensitivityChart } from './charts/AnnuitySensitivityChart';
import { TSPDepletionChart } from './charts/TSPDepletionChart';
import { ChartSkeleton } from './charts/ChartSkeleton';
import type { SimulationData } from '@hooks/useSimulation';
import { useFullSimulation } from '@hooks/useFullSimulation';
import { computeSSClaimingVariants } from '@utils/ss-claiming-helper';

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
  const fullSimulation = useFullSimulation();

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
      <CollapsibleChartSection
        id="income-vs-expenses"
        title="Income vs. Expenses Projection"
        description="30-year retirement income and spending forecast"
        defaultOpen={true}
      >
        <IncomeVsExpensesChart data={result.projections} />
      </CollapsibleChartSection>

      {/* Tax-Adjusted Income Waterfall (when full simulation available) */}
      {fullSimulation && fullSimulation.years.length > 0 && (
        <CollapsibleChartSection
          id="tax-adjusted-income"
          title="Tax-Adjusted Income"
          description="Gross income by source with federal tax and IRMAA impact"
          defaultOpen={true}
          lazyMount
        >
          <TaxAdjustedIncomeChart data={fullSimulation.years} />
        </CollapsibleChartSection>
      )}

      {/* Social Security Claiming Age Comparison */}
      {fullSimulation && fullSimulation.years.length > 0 && fullSimulation.config && fullSimulation.config.ssMonthlyAt62 && (
        <CollapsibleChartSection
          id="ss-claiming"
          title="Social Security Claiming Age Analysis"
          description="Cumulative lifetime benefits at different claiming ages (most impactful retirement decision)"
          defaultOpen={true}
          lazyMount
        >
          {(() => {
            const variants = computeSSClaimingVariants(
              fullSimulation.config!.ssMonthlyAt62 * 12,
              fullSimulation.config!.birthYear,
            );
            return (
              <SSClaimingComparisonChart
                {...variants}
                retirementAge={fullSimulation.config.retirementAge}
              />
            );
          })()}
        </CollapsibleChartSection>
      )}

      {/* Pay Growth */}
      <CollapsibleChartSection
        id="pay-growth"
        title="Career Pay Growth"
        description="Salary progression from hire to retirement"
        defaultOpen={true}
      >
        <PayGrowthChart data={salaryHistory} retirementYear={retireYear} />
      </CollapsibleChartSection>

      {/* TSP Balances */}
      <CollapsibleChartSection
        id="tsp-balances"
        title="TSP Balance Growth"
        description="Thrift Savings Plan projected accumulation"
        defaultOpen={true}
      >
        <TSPBalancesChart data={tspBalances} />
      </CollapsibleChartSection>

      {/* Leave Balances */}
      <CollapsibleChartSection
        id="leave-balances"
        title="Leave Balances"
        description="Annual and sick leave accrual over career"
        defaultOpen={true}
      >
        <LeaveBalancesChart data={leaveBalances} />
      </CollapsibleChartSection>

      {/* Expense Smile Curve */}
      <CollapsibleChartSection
        id="expense-smile-curve"
        title="Expense Smile Curve"
        description="Expected spending pattern in retirement (Blanchett 2014)"
        defaultOpen={false}
      >
        <ExpenseSmileCurveChart data={smileCurve} />
      </CollapsibleChartSection>

      {/* ──────────────────────────────────────────────────────────────────
          New Charts (C-3 through C-10) — require full simulation data
          ────────────────────────────────────────────────────────────────── */}

      {fullSimulation && fullSimulation.years.length > 0 && (
        <>
          {/* C-7: FERS Supplement Gap */}
          <CollapsibleChartSection
            id="supplement-gap"
            title="Income Sources Over Time"
            description="Shows when FERS supplement ends and when Social Security begins"
            defaultOpen={false}
          >
            <FERSSupplementGapChart data={fullSimulation.years} />
          </CollapsibleChartSection>

          {/* C-10: Net Cash Flow */}
          <CollapsibleChartSection
            id="net-cash-flow"
            title="Net Cash Flow"
            description="Annual surplus or deficit (income minus expenses)"
            defaultOpen={false}
          >
            <NetCashFlowChart data={fullSimulation.years} />
          </CollapsibleChartSection>

          {/* C-5: Roth vs Traditional */}
          <CollapsibleChartSection
            id="roth-vs-traditional"
            title="Roth vs Traditional TSP Balance"
            description="Growth of Roth and Traditional TSP accounts with RMD pressure indicator"
            defaultOpen={false}
            lazyMount
          >
            <RothVsTraditionalChart data={fullSimulation.years} />
          </CollapsibleChartSection>

          {/* C-3: Replacement Ratio */}
          <CollapsibleChartSection
            id="replacement-ratio"
            title="Income Replacement Ratio"
            description="Retirement income as % of pre-retirement salary (80% is typical target)"
            defaultOpen={false}
          >
            <ReplacementRatioChart
              data={fullSimulation.years}
              preRetirementSalary={result.high3Salary}
            />
          </CollapsibleChartSection>

          {/* C-4: Purchasing Power */}
          <CollapsibleChartSection
            id="purchasing-power"
            title="Purchasing Power Analysis"
            description="Annuity growth (COLA-adjusted) vs general inflation erosion"
            defaultOpen={false}
          >
            <PurchasingPowerChart
              inflationRate={fullSimulation.config?.inflationRate ?? 0.03}
              colaRate={fullSimulation.config?.colaRate ?? 0.025}
              years={fullSimulation.config?.endAge ?? 95 - (fullSimulation.config?.retirementAge ?? 62)}
            />
          </CollapsibleChartSection>

          {/* C-6: Healthcare Costs */}
          <CollapsibleChartSection
            id="healthcare-costs"
            title="Healthcare Cost Breakdown"
            description="Healthcare vs other expenses over retirement"
            defaultOpen={false}
          >
            <HealthcareCostChart
              data={fullSimulation.years}
              config={fullSimulation.config}
            />
          </CollapsibleChartSection>

          {/* C-8: Annuity Sensitivity */}
          <CollapsibleChartSection
            id="annuity-sensitivity"
            title="Annuity Sensitivity Analysis"
            description="How annuity changes with different retirement ages"
            defaultOpen={false}
            lazyMount
          >
            <AnnuitySensitivityChart
              high3Salary={result.high3Salary}
              creditableServiceAtCurrentAge={result.creditableServiceYears}
              currentAge={Math.floor((new Date().getTime() - new Date(result.inputSummary.profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
              survivorBenefitOption={result.inputSummary.assumptions.survivorBenefitOption ?? 'none'}
            />
          </CollapsibleChartSection>

          {/* C-9: TSP Depletion */}
          <CollapsibleChartSection
            id="tsp-depletion"
            title="TSP Balance Depletion"
            description="Projected TSP account balance over retirement"
            defaultOpen={false}
            lazyMount
          >
            <TSPDepletionChart data={fullSimulation.years} config={fullSimulation.config} />
          </CollapsibleChartSection>
        </>
      )}
    </div>
  );
}
