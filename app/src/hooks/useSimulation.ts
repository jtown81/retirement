import { useMemo } from 'react';
import type { SimulationInput, SimulationResult, SimulationConfig } from '@models/simulation';
import type { TaxProfile } from '@models/tax';
import type {
  PayGrowthDataPoint,
  LeaveBalanceDataPoint,
  TSPBalanceDataPoint,
  SmileCurveDataPoint,
  IncomeWaterfallDataPoint,
  TSPLifecycleDataPoint,
  ExpensePhaseDataPoint,
  RMDDataPoint,
  MonteCarloYearBand,
} from '@components/charts/chart-types';
import { buildSalaryHistory } from '@modules/career';
import { simulateLeaveYear } from '@modules/leave';
import { projectTraditionalDetailed, projectRothDetailed, getRMDStartAge } from '@modules/tsp';
import {
  smileCurveMultiplier,
  applySmileCurve,
  defaultSmileCurveParams,
} from '@modules/expenses';
import { projectRetirementIncome, projectRetirementSimulation, runMonteCarlo } from '@modules/simulation';
import { useLocalStorage } from './useLocalStorage';
import { TaxProfileSchema } from '@storage/zod-schemas';
import { STORAGE_KEYS } from '@storage/schema';

export interface SimulationData {
  result: SimulationResult;
  salaryHistory: PayGrowthDataPoint[];
  leaveBalances: LeaveBalanceDataPoint[];
  tspBalances: TSPBalanceDataPoint[];
  smileCurve: SmileCurveDataPoint[];
  /** Full simulation result if SimulationConfig was available (null otherwise) */
  fullSimulation?: ReturnType<typeof projectRetirementSimulation> | null;
  // New datasets for expanded dashboard
  incomeWaterfall: IncomeWaterfallDataPoint[];
  tspLifecycle: TSPLifecycleDataPoint[];
  expensePhases: ExpensePhaseDataPoint[];
  rmdTimeline: RMDDataPoint[];
  // Monte Carlo stochastic analysis (NEW in PR-008)
  monteCarloResult?: {
    bands: MonteCarloYearBand[];
    overallSuccessRate: number;
    successRateAt85: number;
  } | null;
}

/**
 * Runs the full simulation and produces all chart datasets.
 * Returns null if input is null.
 *
 * Flow:
 * 1. If simConfig is provided: runs projectRetirementSimulation() for full dual-pot TSP + RMD simulation
 * 2. Always runs simple path: projectRetirementIncome() for basic income vs expense projection
 * 3. Produces chart datasets from both paths where applicable
 * 4. Passes tax profile to projectRetirementSimulation if available (NEW in Phase 10)
 */
export function useSimulation(
  input: SimulationInput | null,
  simConfig: SimulationConfig | null = null,
): SimulationData | null {
  // Read tax profile from localStorage (NEW in Phase 10)
  const [taxProfile] = useLocalStorage<TaxProfile>(STORAGE_KEYS.TAX_PROFILE, TaxProfileSchema);

  return useMemo(() => {
    if (!input) return null;

    // Run the simple path (always)
    const result = projectRetirementIncome(input);

    // Run the full simulation if config is available, passing tax profile for tax calculations
    const fullSimulation = simConfig ? projectRetirementSimulation(simConfig, taxProfile ?? undefined) : null;

    const retireYear = new Date(input.assumptions.proposedRetirementDate).getFullYear();

    // Salary history
    const salaryHistory: PayGrowthDataPoint[] = buildSalaryHistory(
      input.profile.career,
      retireYear - 1,
    ).map((sy) => ({
      year: sy.year,
      salary: sy.annualSalary,
      grade: sy.grade,
      step: sy.step,
    }));

    // Leave balances
    const hireYear = new Date(input.profile.career.scdLeave).getFullYear();
    const leaveBalances: LeaveBalanceDataPoint[] = [];
    let annualCarry = 0;
    let sickCarry = 0;
    // Use average annual sick leave usage if provided
    const avgSickUsage = input.profile.leaveBalance.averageAnnualSickLeaveUsage ?? 0;
    for (let year = hireYear; year < retireYear; year++) {
      const yearsOfService = year - hireYear;
      // Create usage events if average sick leave usage is provided
      const usageEvents = avgSickUsage > 0
        ? [{ id: 'avg-sick', date: `${year}-06-15`, type: 'sick' as const, hoursUsed: avgSickUsage }]
        : [];
      const lr = simulateLeaveYear({
        yearsOfService,
        annualLeaveCarryIn: annualCarry,
        sickLeaveCarryIn: sickCarry,
        payPeriodsWorked: 26,
        usageEvents,
      });
      leaveBalances.push({
        year,
        annualLeaveHours: lr.annualLeaveEndOfYear,
        sickLeaveHours: lr.sickLeaveEndOfYear,
      });
      annualCarry = lr.annualLeaveEndOfYear;
      sickCarry = lr.sickLeaveEndOfYear;
    }

    // TSP balances (fix Roth bug: project both Traditional and Roth)
    const tspBalances: TSPBalanceDataPoint[] = (() => {
      const tradBalance = input.profile.tspBalances.traditionalBalance;
      const rothBalance = input.profile.tspBalances.rothBalance;
      if (tradBalance === 0 && rothBalance === 0) return [];

      const currentYear = new Date().getFullYear();
      const yearsToRetirement = Math.max(0, retireYear - currentYear);
      const lastSalary = salaryHistory.length > 0 ? salaryHistory[salaryHistory.length - 1].salary : 50_000;

      // Estimate contributions based on last salary (default: 5% Traditional, 2% Roth)
      // These are reasonable assumptions for federal employees
      const estimatedTradContrib = lastSalary * 0.05;
      const estimatedRothContrib = lastSalary * 0.02;

      // Determine the projection period:
      // - If retirement is in future: project from now to retirement
      // - If retirement is past: show historical accumulation from hire to retirement
      let projectionStartYear: number;
      let projectionYears: number;

      if (yearsToRetirement > 0) {
        // Future retirement: project from current year forward
        projectionStartYear = currentYear;
        projectionYears = yearsToRetirement;
      } else {
        // Past or current year retirement: show accumulation from hire year
        projectionStartYear = hireYear;
        projectionYears = Math.min(retireYear - hireYear, 25); // Cap at 25 years like before
      }

      // Project Traditional TSP (using actual current balance, not 10%)
      const tradYears = projectTraditionalDetailed({
        openingBalance: tradBalance,
        annualSalary: lastSalary,
        employeeAnnualContribution: estimatedTradContrib,
        employeeContributionPct: 0.05,
        growthRate: input.assumptions.tspGrowthRate,
        years: projectionYears,
        startYear: projectionStartYear,
        isCatchUpEligible: false,
      });

      // Project Roth TSP (using actual current balance, not 10%)
      const rothYears = projectRothDetailed({
        openingBalance: rothBalance,
        employeeAnnualContribution: estimatedRothContrib,
        growthRate: input.assumptions.tspGrowthRate,
        years: projectionYears,
        startYear: projectionStartYear,
        isCatchUpEligible: false,
        traditionalEmployeeContribution: estimatedTradContrib,
      });

      // Combine results
      return tradYears.map((ty, i) => ({
        year: ty.year,
        traditionalBalance: ty.closingBalance,
        rothBalance: rothYears[i]?.closingBalance ?? 0,
        totalBalance: (ty.closingBalance ?? 0) + (rothYears[i]?.closingBalance ?? 0),
      }));
    })();

    // Smile curve
    const baseExpenses = input.profile.expenses.categories.reduce(
      (sum, c) => sum + c.annualAmount,
      0,
    );
    const smileParams = input.profile.expenses.smileCurveEnabled
      ? (input.profile.expenses.smileCurveParams ?? defaultSmileCurveParams)
      : defaultSmileCurveParams;

    const smileCurve: SmileCurveDataPoint[] = [];
    for (let yr = 0; yr <= input.assumptions.retirementHorizonYears; yr++) {
      smileCurve.push({
        yearsIntoRetirement: yr,
        multiplier: smileCurveMultiplier(yr, smileParams),
        adjustedExpenses: applySmileCurve(baseExpenses, yr, smileParams),
        baseExpenses,
      });
    }

    // Income Waterfall: Use fullSimulation if available, else use simple path
    const incomeWaterfall: IncomeWaterfallDataPoint[] = fullSimulation
      ? fullSimulation.years.map((yr) => ({
          year: yr.year,
          age: yr.age,
          annuity: yr.annuity,
          fersSupplement: yr.fersSupplement,
          socialSecurity: yr.socialSecurity,
          tspWithdrawal: yr.tspWithdrawal,
          totalIncome: yr.totalIncome,
          totalExpenses: yr.totalExpenses,
          surplus: yr.surplus,
          // Tax data (NEW in Phase 10)
          federalTax: yr.federalTax,
          stateTax: yr.stateTax,
          irmaaSurcharge: yr.irmaaSurcharge,
          totalTax: yr.totalTax,
          afterTaxIncome: yr.afterTaxIncome,
        }))
      : result.projections.map((proj) => ({
          year: proj.year,
          age: proj.age,
          annuity: proj.annuity,
          fersSupplement: proj.fersSupplementAmount,
          socialSecurity: 0, // Simple path doesn't track SS
          tspWithdrawal: proj.tspWithdrawal,
          totalIncome: proj.totalIncome,
          totalExpenses: proj.totalExpenses,
          surplus: proj.surplus,
        }));

    // TSP Lifecycle: Concatenate pre-retirement and post-retirement segments
    const tspLifecycle: TSPLifecycleDataPoint[] = [];
    // Pre-retirement accumulation
    for (const dp of tspBalances) {
      tspLifecycle.push({
        year: dp.year,
        phase: 'accumulation',
        traditionalBalance: dp.traditionalBalance,
        rothBalance: dp.rothBalance,
        totalBalance: dp.totalBalance,
      });
    }
    // Post-retirement distribution (if fullSimulation available)
    if (fullSimulation) {
      for (const yr of fullSimulation.years) {
        tspLifecycle.push({
          year: yr.year,
          age: yr.age,
          phase: 'distribution',
          traditionalBalance: yr.traditionalBalance,
          rothBalance: yr.rothBalance,
          totalBalance: yr.totalTSPBalance,
          highRiskBalance: yr.highRiskBalance,
          lowRiskBalance: yr.lowRiskBalance,
          rmdRequired: yr.rmdRequired,
          rmdSatisfied: yr.rmdSatisfied,
          withdrawal: fullSimulation.config.withdrawalRate * yr.totalTSPBalance,
        });
      }
    }

    // Expense Phases: Map fullSimulation phase data with Blanchett comparison
    const expensePhases: ExpensePhaseDataPoint[] = fullSimulation
      ? fullSimulation.years.map((yr) => {
          const blanchettMultiplier = smileCurveMultiplier(yr.age - result.projections[0]?.age || 0, smileParams);
          const phase =
            yr.age < fullSimulation.config.goGoEndAge
              ? 'GoGo'
              : yr.age < fullSimulation.config.goSlowEndAge
                ? 'GoSlow'
                : 'NoGo';

          return {
            year: yr.year,
            age: yr.age,
            yearsIntoRetirement: yr.age - fullSimulation.config.retirementAge,
            phase,
            baseExpenses: fullSimulation.config.baseAnnualExpenses,
            adjustedExpenses: yr.totalExpenses,
            blanchettAdjusted: applySmileCurve(
              fullSimulation.config.baseAnnualExpenses,
              yr.age - fullSimulation.config.retirementAge,
              smileParams,
            ),
            smileMultiplier: yr.smileMultiplier,
          };
        })
      : [];

    // RMD Timeline: Extract RMD data from fullSimulation for RMD start age+
    const rmdTimeline: RMDDataPoint[] = fullSimulation
      ? (() => {
          // Use dynamic RMD start age based on birth year (73 for born <1960, 75 for >=1960 per SECURE 2.0)
          const rmdStartAge = fullSimulation.config.birthYear
            ? getRMDStartAge(fullSimulation.config.birthYear)
            : 73;

          return fullSimulation.years
            .filter((yr) => yr.age >= rmdStartAge)
            .map((yr) => ({
              year: yr.year,
              age: yr.age,
              rmdRequired: yr.rmdRequired,
              actualWithdrawal: yr.tspWithdrawal,
              rmdSatisfied: yr.rmdSatisfied,
              totalTSPBalance: yr.totalTSPBalance,
            }));
        })()
      : [];

    // Monte Carlo stochastic analysis (NEW in PR-008)
    // Only run if fullSimulation is available
    const monteCarloResult = fullSimulation && simConfig
      ? runMonteCarlo(simConfig, { iterations: 1000 })
      : null;

    return {
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
      monteCarloResult,
    };
  }, [input, simConfig, taxProfile]);
}
