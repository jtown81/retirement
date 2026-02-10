import { AppShell } from './layout/AppShell';
import { SectionHeading } from './layout/SectionHeading';
import { SummaryPanel } from './cards/SummaryPanel';
import { IncomeVsExpensesChart } from './charts/IncomeVsExpensesChart';
import { PayGrowthChart } from './charts/PayGrowthChart';
import { TSPBalancesChart } from './charts/TSPBalancesChart';
import { LeaveBalancesChart } from './charts/LeaveBalancesChart';
import { ExpenseSmileCurveChart } from './charts/ExpenseSmileCurveChart';
import {
  DEMO_RESULT,
  DEMO_SALARY_HISTORY,
  DEMO_LEAVE_BALANCES,
  DEMO_TSP_BALANCES,
  DEMO_SMILE_CURVE,
} from '@data/demo-fixture';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const retireYear = DEMO_RESULT.projections[0]?.year;
const year1Surplus = DEMO_RESULT.projections[0]?.surplus ?? 0;

export function Dashboard() {
  return (
    <AppShell>
      {/* Summary Cards */}
      <section>
        <SectionHeading
          title="Retirement Summary"
          description="Key metrics for the GS straight-through demo scenario"
        />
        <SummaryPanel
          annuity={USD_FORMAT.format(DEMO_RESULT.annualAnnuity)}
          high3={USD_FORMAT.format(DEMO_RESULT.high3Salary)}
          creditableService={`${DEMO_RESULT.creditableServiceYears.toFixed(1)} yrs`}
          eligibilityType={DEMO_RESULT.eligibility.type ?? 'N/A'}
          fersSupplement={DEMO_RESULT.fersSupplementEligible ? 'Eligible' : 'Not Eligible'}
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
        <IncomeVsExpensesChart data={DEMO_RESULT.projections} />
      </section>

      {/* Pay Growth */}
      <section>
        <SectionHeading
          title="Career Pay Growth"
          description="Salary progression from hire to retirement"
        />
        <PayGrowthChart data={DEMO_SALARY_HISTORY} retirementYear={retireYear} />
      </section>

      {/* TSP Balances */}
      <section>
        <SectionHeading
          title="TSP Balance Growth"
          description="Thrift Savings Plan projected accumulation"
        />
        <TSPBalancesChart data={DEMO_TSP_BALANCES} />
      </section>

      {/* Leave Balances */}
      <section>
        <SectionHeading
          title="Leave Balances"
          description="Annual and sick leave accrual over career"
        />
        <LeaveBalancesChart data={DEMO_LEAVE_BALANCES} />
      </section>

      {/* Expense Smile Curve */}
      <section>
        <SectionHeading
          title="Expense Smile Curve"
          description="Expected spending pattern in retirement (Blanchett 2014)"
        />
        <ExpenseSmileCurveChart data={DEMO_SMILE_CURVE} />
      </section>
    </AppShell>
  );
}
