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
  purpose: 'Projects year-by-year TSP balance from retirement through age 104, finding depletion age.',
  sourceRef: 'Retire-original.xlsx Basic Calculator V4:AB104',
  classification: 'assumption',
  version: '1.0.0',
  changelog: [{ date: '2026-02-10', author: 'system', description: 'Initial implementation' }],
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
  yearByYear: Array<{ age: number; balance: number }>;
}

/**
 * Projects TSP balance year-by-year post-retirement to find depletion age.
 *
 * Each year: balance = (previous balance × (1 + growthRate)) - annualWithdrawal
 * Optional one-time withdrawal at a specified age.
 * Projects through age 104.
 *
 * @param balanceAtRetirement - TSP balance at start of retirement
 * @param annualWithdrawal - Fixed annual withdrawal amount
 * @param growthRate - Annual growth rate on remaining balance
 * @param retirementAge - Age at retirement (integer)
 * @param oneTimeWithdrawal - Optional one-time withdrawal (amount + age)
 * @returns Depletion result with age and balance at 85
 */
export function projectTSPDepletion(
  balanceAtRetirement: number,
  annualWithdrawal: number,
  growthRate: number,
  retirementAge: number,
  oneTimeWithdrawal?: { amount: number; age: number },
): TSPDepletionResult {
  const MAX_AGE = 104;
  const yearByYear: Array<{ age: number; balance: number }> = [];
  let balance = balanceAtRetirement;
  let depletionAge: number | null = null;
  let balanceAt85 = 0;

  // Apply one-time withdrawal at retirement age if it matches
  if (oneTimeWithdrawal && oneTimeWithdrawal.age === Math.round(retirementAge)) {
    balance = Math.max(0, balance - oneTimeWithdrawal.amount);
  }

  yearByYear.push({ age: Math.round(retirementAge), balance });

  for (let age = Math.round(retirementAge) + 1; age <= MAX_AGE; age++) {
    // Apply one-time withdrawal at the specified age
    if (oneTimeWithdrawal && age === oneTimeWithdrawal.age && yearByYear.length > 1) {
      balance = Math.max(0, balance - oneTimeWithdrawal.amount);
    }

    // Grow balance then withdraw
    balance = balance * (1 + growthRate);
    balance = balance - annualWithdrawal;

    if (balance <= 0) {
      balance = 0;
      if (depletionAge === null) {
        depletionAge = age;
      }
    }

    yearByYear.push({ age, balance });

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
