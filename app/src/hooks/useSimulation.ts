import { useMemo } from 'react';
import type { SimulationInput, SimulationResult, SimulationConfig } from '@models/simulation';
import type {
  PayGrowthDataPoint,
  LeaveBalanceDataPoint,
  TSPBalanceDataPoint,
  SmileCurveDataPoint,
} from '@components/charts/chart-types';
import { buildSalaryHistory } from '@modules/career';
import { simulateLeaveYear } from '@modules/leave';
import { projectTraditionalDetailed } from '@modules/tsp';
import {
  smileCurveMultiplier,
  applySmileCurve,
  defaultSmileCurveParams,
} from '@modules/expenses';
import { projectRetirementIncome, projectRetirementSimulation } from '@modules/simulation';

export interface SimulationData {
  result: SimulationResult;
  salaryHistory: PayGrowthDataPoint[];
  leaveBalances: LeaveBalanceDataPoint[];
  tspBalances: TSPBalanceDataPoint[];
  smileCurve: SmileCurveDataPoint[];
  /** Full simulation result if SimulationConfig was available (null otherwise) */
  fullSimulation?: ReturnType<typeof projectRetirementSimulation> | null;
}

/**
 * Runs the full simulation and produces all chart datasets.
 * Returns null if input is null.
 *
 * Flow:
 * 1. If simConfig is provided: runs projectRetirementSimulation() for full dual-pot TSP + RMD simulation
 * 2. Always runs simple path: projectRetirementIncome() for basic income vs expense projection
 * 3. Produces chart datasets from both paths where applicable
 */
export function useSimulation(
  input: SimulationInput | null,
  simConfig: SimulationConfig | null = null,
): SimulationData | null {
  return useMemo(() => {
    if (!input) return null;

    // Run the simple path (always)
    const result = projectRetirementIncome(input);

    // Run the full simulation if config is available
    const fullSimulation = simConfig ? projectRetirementSimulation(simConfig) : null;

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
    for (let year = hireYear; year < retireYear; year++) {
      const yearsOfService = year - hireYear;
      const lr = simulateLeaveYear({
        yearsOfService,
        annualLeaveCarryIn: annualCarry,
        sickLeaveCarryIn: sickCarry,
        payPeriodsWorked: 26,
        usageEvents: [],
      });
      leaveBalances.push({
        year,
        annualLeaveHours: lr.annualLeaveEndOfYear,
        sickLeaveHours: lr.sickLeaveEndOfYear,
      });
      annualCarry = lr.annualLeaveEndOfYear;
      sickCarry = lr.sickLeaveEndOfYear;
    }

    // TSP balances (use detailed projection if contributions exist)
    const tspBalances: TSPBalanceDataPoint[] = (() => {
      const tradBalance = input.profile.tspBalances.traditionalBalance;
      const rothBalance = input.profile.tspBalances.rothBalance;
      if (tradBalance === 0 && rothBalance === 0) return [];

      const years = projectTraditionalDetailed({
        openingBalance: tradBalance > 0 ? tradBalance * 0.1 : 0,
        annualSalary: salaryHistory.length > 0 ? salaryHistory[salaryHistory.length - 1].salary : 50_000,
        employeeAnnualContribution: 5_000,
        employeeContributionPct: 0.10,
        growthRate: input.assumptions.tspGrowthRate,
        years: Math.min(retireYear - hireYear, 25),
        startYear: retireYear - Math.min(retireYear - hireYear, 25),
        isCatchUpEligible: false,
      });

      return years.map((ty) => ({
        year: ty.year,
        traditionalBalance: ty.closingBalance,
        rothBalance: 0,
        totalBalance: ty.closingBalance,
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

    return { result, salaryHistory, leaveBalances, tspBalances, smileCurve, fullSimulation };
  }, [input, simConfig]);
}
