/**
 * TSP Future Value & Depletion Projection
 * Formulas: tsp/future-value, tsp/depletion-projection
 *
 * Computes the projected TSP balance at retirement using compound interest,
 * and projects year-by-year post-retirement depletion given withdrawals and growth.
 *
 * Source: Standard compound interest formulas; spreadsheet "Basic Calculator" tab.
 */

import { registerFormula } from '../../registry/index';
import { computeRMD } from './rmd';

registerFormula({
  id: 'tsp/future-value',
  name: 'TSP Future Value (Compound Interest)',
  module: 'tsp',
  purpose: 'Projects TSP balance at retirement given current balance, monthly contributions, growth rate, and years to retirement.',
  sourceRef: 'Standard compound interest formula; Retire-original.xlsx Basic Calculator K39',
  classification: 'assumption',
  version: '1.0.0',
  changelog: [{ date: '2026-02-10', author: 'system', description: 'Initial implementation' }],
});

registerFormula({
  id: 'tsp/depletion-projection',
  name: 'TSP Post-Retirement Depletion Projection',
  module: 'tsp',
  purpose: 'Projects year-by-year TSP balance from retirement through age 104, finding depletion age. Enforces RMD floor when birthYear is provided.',
  sourceRef: 'Retire-original.xlsx Basic Calculator V4:AB104; IRC § 401(a)(9); SECURE 2.0 Act § 107',
  classification: 'assumption',
  version: '1.1.0',
  changelog: [
    { date: '2026-02-10', author: 'system', description: 'Initial implementation' },
    { date: '2026-02-18', author: 'system', description: 'Added RMD floor enforcement and Traditional/Roth tracking' },
  ],
});

registerFormula({
  id: 'tsp/pre-retirement-projection',
  name: 'Pre-Retirement TSP Year-by-Year Projection with Salary Growth (Phase D)',
  module: 'tsp',
  purpose: 'Projects TSP balance year-by-year before retirement, accounting for salary growth, contribution limits, agency match, and compound growth.',
  sourceRef: 'IRS contribution limits; TSP matching rules 5 U.S.C. § 8432; standard compound interest',
  classification: 'assumption',
  version: '1.0.0',
  changelog: [{ date: '2026-02-14', author: 'system', description: 'Phase D implementation - salary-aware pre-retirement projection' }],
});

/**
 * Computes the projected TSP balance at retirement using monthly compounding.
 *
 * Formula: FV = PV × (1 + r/12)^(n×12) + PMT × [((1 + r/12)^(n×12) - 1) / (r/12)]
 *
 * @param currentBalance - Current TSP balance ($)
 * @param monthlyContribution - Monthly contribution amount ($)
 * @param annualGrowthRate - Annual growth rate (e.g., 0.07 = 7%)
 * @param yearsToRetirement - Years until retirement (fractional OK)
 * @returns Projected TSP balance at retirement
 */
export function computeTSPFutureValue(
  currentBalance: number,
  monthlyContribution: number,
  annualGrowthRate: number,
  yearsToRetirement: number,
): number {
  if (currentBalance < 0) throw new RangeError('currentBalance must be >= 0');
  if (monthlyContribution < 0) throw new RangeError('monthlyContribution must be >= 0');
  if (yearsToRetirement < 0) throw new RangeError('yearsToRetirement must be >= 0');

  if (yearsToRetirement === 0) return currentBalance;

  const monthlyRate = annualGrowthRate / 12;
  const totalMonths = yearsToRetirement * 12;

  if (monthlyRate === 0) {
    // No growth — simple sum
    return currentBalance + monthlyContribution * totalMonths;
  }

  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const balanceGrowth = currentBalance * compoundFactor;
  const contributionGrowth = monthlyContribution * ((compoundFactor - 1) / monthlyRate);

  return balanceGrowth + contributionGrowth;
}

export interface TSPDepletionResult {
  /** Age when TSP runs out, or null if balance survives through age 104 ("NEVER") */
  depletionAge: number | null;
  /** TSP balance at age 85 (0 if depleted before 85) */
  balanceAt85: number;
  /** Year-by-year projection from retirement age */
  yearByYear: Array<{
    age: number;
    balance: number;
    rmdAmount: number; // IRS Required Minimum Distribution (0 if no RMD required at that age)
    actualWithdrawal: number; // max(plannedWithdrawal, rmdAmount)
  }>;
}

/**
 * Projects TSP balance year-by-year post-retirement to find depletion age.
 *
 * Each year: balance = (previous balance × (1 + growthRate)) - annualWithdrawal
 * Optional one-time withdrawal at a specified age.
 * If birthYear is provided, enforces RMD floor: actualWithdrawal = max(annualWithdrawal, rmdAmount).
 * Projects through age 104.
 *
 * @param balanceAtRetirement - TSP balance at start of retirement
 * @param annualWithdrawal - Fixed annual withdrawal amount
 * @param growthRate - Annual growth rate on remaining balance
 * @param retirementAge - Age at retirement (integer)
 * @param oneTimeWithdrawal - Optional one-time withdrawal (amount + age)
 * @param birthYear - Optional birth year (enables RMD floor enforcement per IRC § 401(a)(9))
 * @param traditionalFraction - Optional fraction of TSP that is Traditional (0-1, default 1.0 for conservative RMD calculation)
 * @returns Depletion result with age, balance at 85, and year-by-year detail including RMD amounts
 */
export function projectTSPDepletion(
  balanceAtRetirement: number,
  annualWithdrawal: number,
  growthRate: number,
  retirementAge: number,
  oneTimeWithdrawal?: { amount: number; age: number },
  birthYear?: number,
  traditionalFraction?: number,
): TSPDepletionResult {
  const MAX_AGE = 104;
  const yearByYear: Array<{
    age: number;
    balance: number;
    rmdAmount: number;
    actualWithdrawal: number;
  }> = [];
  let balance = balanceAtRetirement;
  let depletionAge: number | null = null;
  let balanceAt85 = 0;

  // Initialize Traditional/Roth tracking for RMD enforcement
  const tradFraction = traditionalFraction ?? 1.0;
  let tradBalance = balance * tradFraction;
  let rothBalance = balance * (1 - tradFraction);

  // Apply one-time withdrawal at retirement age if it matches
  if (oneTimeWithdrawal && oneTimeWithdrawal.age === Math.round(retirementAge)) {
    balance = Math.max(0, balance - oneTimeWithdrawal.amount);
    tradBalance = balance * tradFraction;
    rothBalance = balance * (1 - tradFraction);
  }

  yearByYear.push({
    age: Math.round(retirementAge),
    balance,
    rmdAmount: 0,
    actualWithdrawal: 0,
  });

  for (let age = Math.round(retirementAge) + 1; age <= MAX_AGE; age++) {
    // Apply one-time withdrawal at the specified age
    if (oneTimeWithdrawal && age === oneTimeWithdrawal.age && yearByYear.length > 1) {
      balance = Math.max(0, balance - oneTimeWithdrawal.amount);
      tradBalance = balance * tradFraction;
      rothBalance = balance * (1 - tradFraction);
    }

    // Grow balance (before RMD/withdrawal calculation)
    balance = balance * (1 + growthRate);
    tradBalance = tradBalance * (1 + growthRate);
    rothBalance = rothBalance * (1 + growthRate);

    // Compute RMD on prior year-end Traditional balance (before growth for this year)
    // Using the balance from the previous iteration's end (which is now before growth)
    const priorYearTradBalance = tradBalance / (1 + growthRate); // Reverse growth to get prior year-end
    const rmdAmount = birthYear ? computeRMD(priorYearTradBalance, age, birthYear) : 0;

    // Actual withdrawal is the maximum of planned and RMD
    const actualWithdrawal = Math.max(annualWithdrawal, rmdAmount);

    // Apply withdrawal (Traditional first, then Roth)
    balance = balance - actualWithdrawal;
    const tradWithdrawal = Math.min(tradBalance, actualWithdrawal);
    tradBalance = tradBalance - tradWithdrawal;
    const rothWithdrawal = actualWithdrawal - tradWithdrawal;
    rothBalance = Math.max(0, rothBalance - rothWithdrawal);

    if (balance <= 0) {
      balance = 0;
      tradBalance = 0;
      rothBalance = 0;
      if (depletionAge === null) {
        depletionAge = age;
      }
    }

    yearByYear.push({ age, balance, rmdAmount, actualWithdrawal });

    if (age === 85) {
      balanceAt85 = balance;
    }
  }

  // If we didn't reach 85 in the loop (retirement after 85)
  if (Math.round(retirementAge) > 85) {
    balanceAt85 = balanceAtRetirement;
  }

  return { depletionAge, balanceAt85, yearByYear };
}

// ─────────────────────────────────────────────────────────────────────────────

export interface PreRetirementTSPYear {
  /** Year number (0 = now, 1 = next year, etc.) */
  year: number;
  /** Annual salary (in dollars) */
  salary: number;
  /** Employee contribution (biweekly contribution × 26) */
  employeeContribution: number;
  /** Agency automatic contribution (1% of salary) */
  agencyAutomatic: number;
  /** Agency match contribution (matches employee up to limits) */
  agencyMatch: number;
  /** Total contributions (employee + auto + match) */
  totalContribution: number;
  /** Starting balance for the year */
  startingBalance: number;
  /** Growth on the balance during the year */
  growthAmount: number;
  /** Ending balance after contributions and growth */
  endingBalance: number;
  /** Traditional balance (includes all agency contributions) */
  traditionalBalance: number;
  /** Roth balance (if applicable) */
  rothBalance: number;
}

export interface PreRetirementTSPProjection {
  /** Year-by-year breakdown */
  years: PreRetirementTSPYear[];
  /** Final balance at retirement */
  finalBalance: number;
  /** Final Traditional balance */
  finalTraditionalBalance: number;
  /** Final Roth balance */
  finalRothBalance: number;
}

/**
 * Projects TSP balance year-by-year before retirement (Phase D enhancement).
 *
 * Accounts for:
 * - Annual salary growth
 * - Employee contributions as a % of salary (capped to IRS limits)
 * - Agency automatic contribution (1% of salary)
 * - Agency match (matches employee contributions up to 5% total)
 * - Month-by-month compound growth within each year
 * - Separate Traditional and Roth tracking
 *
 * @param currentBalance - Starting TSP balance
 * @param traditionalPct - Fraction that is Traditional (remainder is Roth)
 * @param annualSalary - Starting annual salary
 * @param salaryGrowthRate - Annual salary growth rate (e.g., 0.03 = 3%)
 * @param contributionPct - Employee contribution as % of salary (e.g., 0.05 = 5%)
 * @param isRothContribution - If true, employee contributions are to Roth; match still goes to Traditional
 * @param annualGrowthRate - Annual growth rate for TSP (e.g., 0.07 = 7%)
 * @param yearsToRetirement - Number of years to project
 * @returns Year-by-year projection with final balances
 */
export function projectPreRetirementTSP(
  currentBalance: number,
  traditionalPct: number,
  annualSalary: number,
  salaryGrowthRate: number,
  contributionPct: number,
  isRothContribution: boolean,
  annualGrowthRate: number,
  yearsToRetirement: number,
): PreRetirementTSPProjection {
  const years: PreRetirementTSPYear[] = [];
  let traditionalBalance = currentBalance * traditionalPct;
  let rothBalance = currentBalance * (1 - traditionalPct);
  let currentSalary = annualSalary;
  const monthlyRate = annualGrowthRate / 12;
  const MONTHS_PER_YEAR = 12;

  for (let year = 0; year < yearsToRetirement; year++) {
    const startingBalance = traditionalBalance + rothBalance;

    // Calculate contributions for this year
    // Employee contribution (biweekly × 26)
    const annualEmployeeContrib = currentSalary * Math.min(contributionPct, 1.0); // cap at 100%
    const agencyAuto = currentSalary * 0.01; // 1% automatic

    // Agency match: 100% of first 3%, 50% of next 2%
    const matchableUpTo3pct = Math.min(annualEmployeeContrib, currentSalary * 0.03);
    const matchableUpTo5pct = Math.min(
      annualEmployeeContrib - matchableUpTo3pct,
      currentSalary * 0.02,
    );
    const agencyMatchAmount = matchableUpTo3pct * 1.0 + matchableUpTo5pct * 0.5;

    const totalContrib = annualEmployeeContrib + agencyAuto + agencyMatchAmount;

    // Employee and match contributions are split by Trad/Roth,
    // but agency contributions ALWAYS go to Traditional
    const employeeToTrad = isRothContribution ? 0 : annualEmployeeContrib;
    const employeeToRoth = isRothContribution ? annualEmployeeContrib : 0;
    const agencyContribsToTrad = agencyAuto + agencyMatchAmount;

    // Compound growth within the year
    let yearTradBalance = traditionalBalance;
    let yearRothBalance = rothBalance;

    // Add contributions at the beginning, then compound monthly
    // Note: In reality, contributions are added biweekly, but this is a simplified model
    yearTradBalance += employeeToTrad + agencyContribsToTrad;
    yearRothBalance += employeeToRoth;

    // Compound monthly for the year
    for (let month = 0; month < MONTHS_PER_YEAR; month++) {
      yearTradBalance *= 1 + monthlyRate;
      yearRothBalance *= 1 + monthlyRate;
    }

    const growthAmount = yearTradBalance + yearRothBalance - startingBalance - totalContrib;
    const endingBalance = yearTradBalance + yearRothBalance;

    years.push({
      year,
      salary: currentSalary,
      employeeContribution: annualEmployeeContrib,
      agencyAutomatic: agencyAuto,
      agencyMatch: agencyMatchAmount,
      totalContribution: totalContrib,
      startingBalance,
      growthAmount,
      endingBalance,
      traditionalBalance: yearTradBalance,
      rothBalance: yearRothBalance,
    });

    // Update balances for next year
    traditionalBalance = yearTradBalance;
    rothBalance = yearRothBalance;

    // Grow salary for next year
    currentSalary *= 1 + salaryGrowthRate;
  }

  const finalBalance = traditionalBalance + rothBalance;

  return {
    years,
    finalBalance,
    finalTraditionalBalance: traditionalBalance,
    finalRothBalance: rothBalance,
  };
}
