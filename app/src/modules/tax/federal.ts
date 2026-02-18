/**
 * Federal Income Tax Calculator
 *
 * Formula ID: tax/federal-income-tax
 * Source: IRC § 1 (marginal bracket method)
 */

import { getBracketsForYearAndStatus, getStandardDeduction } from './brackets';
import type { FilingStatus } from '@models/tax';

/**
 * Computes federal income tax using the marginal bracket method.
 *
 * Iterates through each tax bracket and accumulates tax on the portion of
 * income that falls within that bracket.
 *
 * @param taxableIncome - Gross income minus deductions (must be >= 0)
 * @param year - Tax year
 * @param filingStatus - Filing status (determines bracket thresholds)
 * @returns Federal income tax owed (dollars, rounded to cents)
 *
 * @throws RangeError if taxableIncome is negative
 *
 * @example
 * computeFederalTax(50000, 2024, 'single') // $5,426 in tax
 */
export function computeFederalTax(taxableIncome: number, year: number, filingStatus: FilingStatus): number {
  if (taxableIncome < 0) {
    throw new RangeError('taxableIncome must be >= 0');
  }

  if (taxableIncome === 0) return 0;

  const brackets = getBracketsForYearAndStatus(year, filingStatus);
  let tax = 0;
  let remaining = taxableIncome;

  for (const bracket of brackets) {
    if (remaining <= 0) break;

    // Calculate the width of this bracket
    const bracketWidth =
      bracket.maxIncome !== null ? bracket.maxIncome - bracket.minIncome : Infinity;

    // Amount of income that falls in this bracket
    const taxableInBracket = Math.min(remaining, bracketWidth);

    // Add tax for this bracket
    tax += taxableInBracket * bracket.rate;

    // Reduce remaining income
    remaining -= taxableInBracket;
  }

  // Round to cents
  return Math.round(tax * 100) / 100;
}

/**
 * Computes federal taxable income after deduction (standard or itemized).
 *
 * @param agi - Adjusted Gross Income (before deduction)
 * @param year - Tax year
 * @param filingStatus - Filing status
 * @param deductionStrategy - Either 'standard' or itemized dollar amount
 * @returns Taxable income (minimum 0)
 *
 * @throws RangeError if itemized deduction is negative
 */
export function computeFederalTaxableIncome(
  agi: number,
  year: number,
  filingStatus: FilingStatus,
  deductionStrategy: 'standard' | number,
): number {
  if (agi < 0) {
    throw new RangeError('agi must be >= 0');
  }

  let deduction = 0;
  if (deductionStrategy === 'standard') {
    deduction = getStandardDeduction(year, filingStatus);
  } else {
    if (deductionStrategy < 0) {
      throw new RangeError('itemized deduction must be >= 0');
    }
    deduction = deductionStrategy;
  }

  return Math.max(0, agi - deduction);
}

/**
 * Computes the effective federal tax rate.
 *
 * Effective rate = total federal tax / gross income
 *
 * @param federalTax - Federal tax owed
 * @param grossIncome - Gross income before deductions
 * @returns Effective rate (e.g., 0.12 for 12% average)
 */
export function getEffectiveFederalRate(federalTax: number, grossIncome: number): number {
  if (grossIncome <= 0) return 0;
  return federalTax / grossIncome;
}

/**
 * Full federal tax computation pipeline.
 *
 * Takes gross income and returns the computed federal tax and effective rate.
 *
 * @param grossIncome - Gross income before any deductions
 * @param year - Tax year
 * @param filingStatus - Filing status
 * @param deductionStrategy - 'standard' or itemized dollar amount
 * @returns Object with taxableIncome, federalTax, and effectiveRate
 *
 * @example
 * const result = computeFederalTaxFull(100000, 2024, 'married-joint', 'standard');
 * // { taxableIncome: 70800, federalTax: 7684, effectiveRate: 0.0768 }
 */
export interface FederalTaxResult {
  agi: number;
  deduction: number;
  taxableIncome: number;
  federalTax: number;
  effectiveRate: number;
}

export function computeFederalTaxFull(
  grossIncome: number,
  year: number,
  filingStatus: FilingStatus,
  deductionStrategy: 'standard' | number,
): FederalTaxResult {
  // For retirement planning: AGI = Gross Income (all from annuity/withdrawals, not investment income)
  const agi = Math.max(0, grossIncome);

  const deduction =
    deductionStrategy === 'standard'
      ? getStandardDeduction(year, filingStatus)
      : deductionStrategy;

  const taxableIncome = computeFederalTaxableIncome(agi, year, filingStatus, deductionStrategy);

  const federalTax = computeFederalTax(taxableIncome, year, filingStatus);

  const effectiveRate = getEffectiveFederalRate(federalTax, grossIncome);

  return {
    agi,
    deduction,
    taxableIncome,
    federalTax,
    effectiveRate,
  };
}
