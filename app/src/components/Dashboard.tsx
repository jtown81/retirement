import { SectionHeading } from './layout/SectionHeading';
import { SummaryPanel } from './cards/SummaryPanel';
import { IncomeVsExpensesChart } from './charts/IncomeVsExpensesChart';
import { PayGrowthChart } from './charts/PayGrowthChart';
import { TSPBalancesChart } from './charts/TSPBalancesChart';
import { LeaveBalancesChart } from './charts/LeaveBalancesChart';
import { ExpenseSmileCurveChart } from './charts/ExpenseSmileCurveChart';
import type { SimulationData } from '@hooks/useSimulation';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface DashboardProps {
  data: SimulationData;
  mode: 'demo' | 'user';
}

export function Dashboard({ data, mode }: DashboardProps) {
  const { result, salaryHistory, leaveBalances, tspBalances, smileCurve } = data;
  const retireYear = result.projections[0]?.year;
  const year1Surplus = result.projections[0]?.surplus ?? 0;

  return (
    <>
      {mode === 'demo' && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
          Showing demo data. Fill in your plan details under "My Plan" to see personalized projections.
        </div>
      )}

      {/* Summary Cards */}
      <section>
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

      {/* Hero Chart: Income vs Expenses */}
      <section>
        <SectionHeading
          title="Income vs. Expenses Projection"
          description="30-year retirement income and spending forecast"
        />
        <IncomeVsExpensesChart data={result.projections} />
      </section>

      {/* Pay Growth */}
      <section>
        <SectionHeading
          title="Career Pay Growth"
          description="Salary progression from hire to retirement"
        />
        <PayGrowthChart data={salaryHistory} retirementYear={retireYear} />
      </section>

      {/* TSP Balances */}
      <section>
        <SectionHeading
          title="TSP Balance Growth"
          description="Thrift Savings Plan projected accumulation"
        />
        <TSPBalancesChart data={tspBalances} />
      </section>

      {/* Leave Balances */}
      <section>
        <SectionHeading
          title="Leave Balances"
          description="Annual and sick leave accrual over career"
        />
        <LeaveBalancesChart data={leaveBalances} />
      </section>

      {/* Expense Smile Curve */}
      <section>
        <SectionHeading
          title="Expense Smile Curve"
          description="Expected spending pattern in retirement (Blanchett 2014)"
        />
        <ExpenseSmileCurveChart data={smileCurve} />
      </section>
    </>
  );
}
