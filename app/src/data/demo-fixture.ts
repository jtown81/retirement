/**
 * Demo Fixture — Pre-computed Chart Data
 *
 * Reuses the GS straight-through scenario constants from the test suite.
 * Calls real engine functions to produce typed data for all 5 charts.
 * No business logic in chart components — this module does all computation.
 *
 * Used by the Dashboard in Phase 8 demo mode (before forms exist).
 */

import type { SimulationInput, SimulationResult } from '@models/simulation';
import type { SmileCurveParams } from '@modules/expenses';
import type {
  PayGrowthDataPoint,
  LeaveBalanceDataPoint,
  TSPBalanceDataPoint,
  SmileCurveDataPoint,
  IncomeWaterfallDataPoint,
  TSPLifecycleDataPoint,
  ExpensePhaseDataPoint,
  RMDDataPoint,
} from '@components/charts/chart-types';
import { buildSalaryHistory } from '@modules/career';
import { simulateLeaveYear } from '@modules/leave';
import { projectTraditionalDetailed, projectRothDetailed } from '@modules/tsp';
import { smileCurveMultiplier, applySmileCurve, defaultSmileCurveParams } from '@modules/expenses';
import { projectRetirementIncome } from '@modules/simulation';

// ── Scenario constants (from gs-straight-through scenario) ───────────────────

const BIRTH_DATE = '1967-07-01';
const HIRE_DATE = '1994-01-01';
const RETIRE_DATE = '2025-01-01';

export const DEMO_INPUT: SimulationInput = {
  profile: {
    birthDate: BIRTH_DATE,
    career: {
      id: 'gs-career',
      scdLeave: HIRE_DATE,
      scdRetirement: HIRE_DATE,
      paySystem: 'GS',
      events: [
        { id: 'e1', type: 'hire', effectiveDate: '1994-01-01', grade: 7, step: 1, localityCode: 'RUS', paySystem: 'GS', annualSalary: 25_000 },
        { id: 'e2', type: 'promotion', effectiveDate: '2000-01-01', grade: 9, step: 5, localityCode: 'RUS', paySystem: 'GS', annualSalary: 50_000 },
        { id: 'e3', type: 'promotion', effectiveDate: '2010-01-01', grade: 12, step: 8, localityCode: 'DCB', paySystem: 'GS', annualSalary: 80_000 },
        { id: 'e4', type: 'promotion', effectiveDate: '2022-01-01', grade: 13, step: 10, localityCode: 'DCB', paySystem: 'GS', annualSalary: 90_000 },
      ],
    },
    leaveBalance: {
      asOf: '2024-12-31',
      annualLeaveHours: 240,
      sickLeaveHours: 1044,
      familyCareUsedCurrentYear: 0,
    },
    tspBalances: {
      asOf: '2024-12-31',
      traditionalBalance: 400_000,
      rothBalance: 0,
    },
    tspContributions: [],
    expenses: {
      id: 'exp-1',
      baseYear: 2025,
      categories: [
        { name: 'housing', annualAmount: 20_000 },
        { name: 'food', annualAmount: 10_000 },
        { name: 'healthcare', annualAmount: 8_000 },
        { name: 'transportation', annualAmount: 5_000 },
        { name: 'travel-leisure', annualAmount: 8_000 },
        { name: 'utilities', annualAmount: 4_000 },
        { name: 'insurance', annualAmount: 3_000 },
        { name: 'personal-care', annualAmount: 1_000 },
        { name: 'gifts-charitable', annualAmount: 1_000 },
      ],
      inflationRate: 0.025,
      smileCurveEnabled: true,
    },
  },
  assumptions: {
    proposedRetirementDate: RETIRE_DATE,
    tspGrowthRate: 0.07,
    colaRate: 0.02,
    retirementHorizonYears: 30,
    tspWithdrawalRate: 0.04,
    estimatedSSMonthlyAt62: 1500,
  },
};

// ── Pre-computed data ────────────────────────────────────────────────────────

/** Full simulation result from the real engine */
export const DEMO_RESULT: SimulationResult = projectRetirementIncome(DEMO_INPUT);

/** Salary history for the pay growth chart */
export const DEMO_SALARY_HISTORY: PayGrowthDataPoint[] = buildSalaryHistory(
  DEMO_INPUT.profile.career,
  new Date(RETIRE_DATE).getFullYear() - 1,
).map((sy) => ({
  year: sy.year,
  salary: sy.annualSalary,
  grade: sy.grade,
  step: sy.step,
}));

/** Leave balances year-by-year for the leave chart */
export const DEMO_LEAVE_BALANCES: LeaveBalanceDataPoint[] = (() => {
  const hireYear = new Date(HIRE_DATE).getFullYear();
  const retireYear = new Date(RETIRE_DATE).getFullYear();
  const results: LeaveBalanceDataPoint[] = [];

  let annualCarry = 0;
  let sickCarry = 0;

  for (let year = hireYear; year < retireYear; year++) {
    const yearsOfService = year - hireYear;
    const result = simulateLeaveYear({
      yearsOfService,
      annualLeaveCarryIn: annualCarry,
      sickLeaveCarryIn: sickCarry,
      payPeriodsWorked: 26,
      usageEvents: [],
    });

    results.push({
      year,
      annualLeaveHours: result.annualLeaveEndOfYear,
      sickLeaveHours: result.sickLeaveEndOfYear,
    });

    annualCarry = result.annualLeaveEndOfYear;
    sickCarry = result.sickLeaveEndOfYear;
  }

  return results;
})();

/** TSP balances year-by-year for the TSP chart (fixed: includes Roth) */
export const DEMO_TSP_BALANCES: TSPBalanceDataPoint[] = (() => {
  // Project Traditional TSP using detailed projection
  const traditionalYears = projectTraditionalDetailed({
    openingBalance: 50_000,  // Starting balance in early career
    annualSalary: 50_000,
    employeeAnnualContribution: 5_000,
    employeeContributionPct: 0.10,
    growthRate: 0.07,
    years: new Date(RETIRE_DATE).getFullYear() - 2000, // ~25 years of contributions
    startYear: 2000,
    isCatchUpEligible: false,
  });

  // Project Roth TSP (fixed bug: was always 0)
  const rothYears = projectRothDetailed({
    openingBalance: 25_000,
    employeeAnnualContribution: 2_000,
    growthRate: 0.07,
    years: new Date(RETIRE_DATE).getFullYear() - 2000,
    startYear: 2000,
    isCatchUpEligible: false,
    traditionalEmployeeContribution: 5_000,
  });

  return traditionalYears.map((ty, i) => ({
    year: ty.year,
    traditionalBalance: ty.closingBalance,
    rothBalance: rothYears[i]?.closingBalance ?? 0,
    totalBalance: (ty.closingBalance ?? 0) + (rothYears[i]?.closingBalance ?? 0),
  }));
})();

/** Smile curve data for the expense chart */
export const DEMO_SMILE_PARAMS: SmileCurveParams = defaultSmileCurveParams;

export const DEMO_SMILE_CURVE: SmileCurveDataPoint[] = (() => {
  const baseExpenses = 60_000;
  const points: SmileCurveDataPoint[] = [];

  for (let yr = 0; yr <= 30; yr++) {
    points.push({
      yearsIntoRetirement: yr,
      multiplier: smileCurveMultiplier(yr),
      adjustedExpenses: applySmileCurve(baseExpenses, yr),
      baseExpenses,
    });
  }

  return points;
})();

/** Income waterfall for new expanded dashboard */
export const DEMO_INCOME_WATERFALL: IncomeWaterfallDataPoint[] = DEMO_RESULT.projections.map((proj) => ({
  year: proj.year,
  age: proj.age,
  annuity: proj.annuity,
  fersSupplement: proj.fersSupplementAmount,
  socialSecurity: 0, // Demo fixture doesn't include full simulation with SS
  tspWithdrawal: proj.tspWithdrawal,
  totalIncome: proj.totalIncome,
  totalExpenses: proj.totalExpenses,
  surplus: proj.surplus,
}));

/** TSP lifecycle combining accumulation and distribution */
export const DEMO_TSP_LIFECYCLE: TSPLifecycleDataPoint[] = (() => {
  const lifecycle: TSPLifecycleDataPoint[] = [];

  // Pre-retirement accumulation
  for (const dp of DEMO_TSP_BALANCES) {
    lifecycle.push({
      year: dp.year,
      phase: 'accumulation',
      traditionalBalance: dp.traditionalBalance,
      rothBalance: dp.rothBalance,
      totalBalance: dp.totalBalance,
    });
  }

  // Post-retirement distribution (simplified without full simulation)
  const retireYear = new Date(RETIRE_DATE).getFullYear();
  let tradBalance = DEMO_TSP_BALANCES[DEMO_TSP_BALANCES.length - 1]?.traditionalBalance ?? 400_000;
  let rothBalance = DEMO_TSP_BALANCES[DEMO_TSP_BALANCES.length - 1]?.rothBalance ?? 0;

  for (let i = 1; i <= 30; i++) {
    const year = retireYear + i;
    const withdrawal = (tradBalance + rothBalance) * 0.04;
    tradBalance = Math.max(0, (tradBalance - withdrawal * 0.8) * 1.07);
    rothBalance = Math.max(0, (rothBalance - withdrawal * 0.2) * 1.07);

    lifecycle.push({
      year,
      age: new Date(BIRTH_DATE).getFullYear() + retireYear + i - new Date(BIRTH_DATE).getFullYear(),
      phase: 'distribution',
      traditionalBalance: tradBalance,
      rothBalance: rothBalance,
      totalBalance: tradBalance + rothBalance,
      withdrawal,
    });
  }

  return lifecycle;
})();

/** Expense phases for new dashboard (demo: no full simulation, so use simple model) */
export const DEMO_EXPENSE_PHASES: ExpensePhaseDataPoint[] = (() => {
  const baseExpenses = 60_000;
  const points: ExpensePhaseDataPoint[] = [];
  const retireYear = new Date(RETIRE_DATE).getFullYear();
  const birthYear = new Date(BIRTH_DATE).getFullYear();

  for (let i = 0; i <= 30; i++) {
    const year = retireYear + i;
    const age = birthYear + year - birthYear;
    const yearsIntoRetirement = i;
    const phase =
      age < 70 ? 'GoGo' : age < 85 ? 'GoSlow' : 'NoGo';

    const multiplier = smileCurveMultiplier(yearsIntoRetirement);
    const adjusted = applySmileCurve(baseExpenses, yearsIntoRetirement);

    points.push({
      year,
      age,
      yearsIntoRetirement,
      phase,
      baseExpenses,
      adjustedExpenses: adjusted,
      blanchettAdjusted: adjusted,
      smileMultiplier: multiplier,
    });
  }

  return points;
})();

/** RMD timeline for ages 73+ (demo: no full simulation) */
export const DEMO_RMD_TIMELINE: RMDDataPoint[] = (() => {
  const points: RMDDataPoint[] = [];
  const retireYear = new Date(RETIRE_DATE).getFullYear();
  const birthYear = new Date(BIRTH_DATE).getFullYear();

  for (let i = 0; i <= 30; i++) {
    const year = retireYear + i;
    const age = birthYear + year - birthYear;

    if (age >= 73) {
      // Simple RMD calculation: divide balance by life expectancy
      let tspBalance = DEMO_TSP_LIFECYCLE.find(lc => lc.year === year)?.totalBalance ?? 0;
      const lifeExpectancy = Math.max(10, 120 - age);
      const rmdRequired = tspBalance / lifeExpectancy;

      points.push({
        year,
        age,
        rmdRequired,
        actualWithdrawal: (tspBalance * 0.04), // Assume 4% rule covers RMD
        rmdSatisfied: true,
        totalTSPBalance: tspBalance,
      });
    }
  }

  return points;
})();
