/**
 * Federal Tax Bracket Lookup
 *
 * Formula ID: tax/federal-bracket
 * Source: IRC § 1; IRS Revenue Procedures (annual COLA adjustments)
 */

import { getBracketsForYear, getStandardDeductionForYear } from '@data/tax-brackets';
import type { FilingStatus, FederalBracket } from '@fedplan/models';

/**
 * Retrieves the federal income tax brackets for a given year and filing status.
 *
 * Brackets are sorted by income (low to high).
 *
 * @param year - Tax year (2023–2026 supported; outside range uses nearest)
 * @param filingStatus - Filing status (determines bracket thresholds)
 * @returns Array of FederalBracket objects, sorted by minIncome
 */
export function getBracketsForYearAndStatus(year: number, filingStatus: FilingStatus): FederalBracket[] {
  const allBrackets = getBracketsForYear(year);
  return allBrackets
    .filter((b) => b.filingStatus === filingStatus)
    .sort((a, b) => a.minIncome - b.minIncome);
}

/**
 * Retrieves the standard deduction for a given year and filing status.
 *
 * @param year - Tax year
 * @param filingStatus - Filing status
 * @returns Standard deduction amount (dollars)
 */
export function getStandardDeduction(year: number, filingStatus: FilingStatus): number {
  return getStandardDeductionForYear(year, filingStatus);
}

/**
 * Computes the effective marginal tax rate at a given income level.
 *
 * Returns the rate that applies to the last dollar earned.
 *
 * @param taxableIncome - Income subject to tax (after deductions)
 * @param year - Tax year
 * @param filingStatus - Filing status
 * @returns Marginal rate (e.g., 0.22 for 22%)
 */
export function getMarginalBracketRate(taxableIncome: number, year: number, filingStatus: FilingStatus): number {
  if (taxableIncome <= 0) return 0.10; // Lowest bracket
  const brackets = getBracketsForYearAndStatus(year, filingStatus);
  for (const bracket of brackets) {
    if (bracket.maxIncome === null || taxableIncome < bracket.maxIncome) {
      return bracket.rate;
    }
  }
  return brackets[brackets.length - 1].rate; // Top bracket
}

/**
 * Computes the effective tax rate (tax / income).
 *
 * Tax is calculated using marginal brackets; effective rate is average.
 *
 * @param taxableIncome - Income subject to tax
 * @param year - Tax year
 * @param filingStatus - Filing status
 * @returns Effective rate (e.g., 0.12 for 12% average)
 */
export function getEffectiveTaxRate(taxableIncome: number, tax: number): number {
  if (taxableIncome <= 0) return 0;
  return tax / taxableIncome;
}

/**
 * Computes the income that remains after a standard deduction.
 *
 * @param grossIncome - Income before deduction
 * @param year - Tax year
 * @param filingStatus - Filing status
 * @returns Taxable income (after standard deduction, minimum 0)
 */
export function applyStandardDeduction(grossIncome: number, year: number, filingStatus: FilingStatus): number {
  const deduction = getStandardDeduction(year, filingStatus);
  return Math.max(0, grossIncome - deduction);
}

/**
 * Retrieves the tax bracket that applies at a given income.
 *
 * @param taxableIncome - Income level
 * @param year - Tax year
 * @param filingStatus - Filing status
 * @returns The FederalBracket object that contains this income
 */
export function getBracketAtIncome(taxableIncome: number, year: number, filingStatus: FilingStatus): FederalBracket {
  const brackets = getBracketsForYearAndStatus(year, filingStatus);
  for (const bracket of brackets) {
    if (bracket.maxIncome === null || taxableIncome < bracket.maxIncome) {
      return bracket;
    }
  }
  return brackets[brackets.length - 1]; // Top bracket
}
