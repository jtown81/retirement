/**
 * Federal Tax Bracket Computation Engine
 *
 * Computes federal income tax from taxable income using marginal bracket tables.
 * Also computes standard deduction including age 65+ additional amounts.
 *
 * Source: IRS tax tables (IRC § 63 for standard deduction, IRC § 1 for brackets)
 */

import type { USD, Rate } from '../../models/common';
import type { FilingStatus } from '../../models/tax';
import { getFederalTaxTable } from '../../data/tax-brackets';

/**
 * Computes federal income tax from taxable income using marginal brackets.
 *
 * The computation uses standard progressive bracket math:
 *   - Apply 10% to income in the first bracket
 *   - Apply 12% to income in the second bracket
 *   - Continue through all applicable brackets
 *
 * @param taxableIncome - Income subject to tax (after standard deduction)
 * @param year - Tax year (YYYY)
 * @param filingStatus - Filing status
 * @returns Federal income tax in dollars
 */
export function computeFederalTax(
  taxableIncome: USD,
  year: number,
  filingStatus: FilingStatus
): USD {
  if (taxableIncome <= 0) return 0;

  const table = getFederalTaxTable(year, filingStatus);
  let tax = 0;
  let previousUpTo = 0;

  for (const bracket of table.brackets) {
    const upTo = bracket.upTo ?? Number.MAX_SAFE_INTEGER;

    if (taxableIncome <= previousUpTo) {
      // Income doesn't reach this bracket
      break;
    }

    // Amount in this bracket
    const amountInBracket = Math.min(taxableIncome, upTo) - previousUpTo;
    tax += amountInBracket * bracket.rate;

    previousUpTo = upTo;

    if (taxableIncome <= upTo) {
      // All income accounted for
      break;
    }
  }

  return tax;
}

/**
 * Computes the standard deduction for a given year, filing status, and age.
 *
 * Includes age 65+ additional standard deduction per IRC § 63(f):
 *   - Single: base + $2,000
 *   - Married filing jointly: base + ($1,600 × number of spouses age 65+)
 *   - Head of household: base + $2,500 (if age 65+)
 *   - Married filing separately: base + $1,600
 *
 * ASSUMPTION: For MFJ, we assume 1 spouse when age >= 65. If both spouses are 65+,
 * double the additional amount is needed (not modeled here; user should add manually).
 *
 * @param year - Tax year (YYYY)
 * @param filingStatus - Filing status
 * @param age - Age of primary taxpayer
 * @returns Standard deduction including age 65+ adjustment
 */
export function computeStandardDeduction(
  year: number,
  filingStatus: FilingStatus,
  age: number
): USD {
  const table = getFederalTaxTable(year, filingStatus);
  const baseDeduction = table.standardDeduction;

  if (age >= 65) {
    return baseDeduction + table.additionalStandardDeduction65;
  }

  return baseDeduction;
}

/**
 * Computes the effective federal tax rate.
 *
 * @param federalTax - Federal income tax
 * @param grossIncome - Total income (all sources, including non-taxable portions)
 * @returns Effective rate as decimal (e.g., 0.12 = 12%)
 */
export function computeEffectiveRate(federalTax: USD, grossIncome: USD): Rate {
  if (grossIncome <= 0) return 0;
  return federalTax / grossIncome;
}
