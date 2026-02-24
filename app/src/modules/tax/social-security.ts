/**
 * Social Security Benefit Taxation
 *
 * Formula ID: tax/ss-provisional-income
 * Source: IRC § 86 (Social Security benefit taxation)
 *
 * Up to 85% of Social Security benefits can be taxable income depending on
 * the taxpayer's "provisional income" (a statutory construct defined in IRC § 86(b)).
 */

import type { FilingStatus } from '@fedplan/models';

/**
 * Computes provisional income per IRC § 86(b).
 *
 * Provisional Income (PI) = AGI + nontaxable interest + 50% of SS benefits
 *
 * The PI determines which tier of SS taxation applies.
 *
 * @param agi - Adjusted Gross Income (from all non-SS sources)
 * @param taxExemptInterest - Municipal interest and other non-taxable interest
 * @param annualSSBenefit - Social Security benefit received (annual)
 * @returns Provisional income
 *
 * @throws RangeError if any input is negative
 */
export function computeProvisionalIncome(
  agi: number,
  taxExemptInterest: number,
  annualSSBenefit: number,
): number {
  if (agi < 0) throw new RangeError('agi must be >= 0');
  if (taxExemptInterest < 0) throw new RangeError('taxExemptInterest must be >= 0');
  if (annualSSBenefit < 0) throw new RangeError('annualSSBenefit must be >= 0');

  return agi + taxExemptInterest + annualSSBenefit * 0.5;
}

/**
 * Computes the taxable fraction of Social Security benefits.
 *
 * The IRC § 86 test applies different rules based on filing status and
 * provisional income thresholds. These thresholds have NOT been indexed
 * for inflation since 1984 and remain fixed statutory amounts.
 *
 * Thresholds (fixed, per IRC § 86(c)):
 *   - Single / Head of Household: $25,000 and $34,000
 *   - Married Filing Jointly:     $32,000 and $44,000
 *   - Married Filing Separately:  $0 (all benefits taxable)
 *
 * Tier 1: PI below lower threshold → 0% of SS taxable
 * Tier 2: PI between thresholds → up to 50% of SS taxable
 * Tier 3: PI above upper threshold → up to 85% of SS taxable
 *
 * @param provisionalIncome - Computed per computeProvisionalIncome()
 * @param filingStatus - Filing status (determines thresholds)
 * @returns Fraction of SS benefit subject to federal income tax (0 | 0.5 | 0.85)
 *
 * @example
 * // Single filer, PI = $30,000
 * computeSSTaxableFraction(30000, 'single') // 0.5 (in tier 2)
 *
 * @example
 * // MFJ filer, PI = $50,000
 * computeSSTaxableFraction(50000, 'married-joint') // 0.85 (in tier 3)
 */
export function computeSSTaxableFraction(
  provisionalIncome: number,
  filingStatus: FilingStatus,
): 0 | 0.5 | 0.85 {
  // Married Filing Separately: all benefits are 85% taxable (punitive rule)
  if (filingStatus === 'married-separate') return 0.85;

  // Single, Head of Household: use $25k/$34k thresholds
  if (filingStatus === 'single' || filingStatus === 'head-of-household') {
    const TIER1_THRESHOLD = 25000;
    const TIER2_THRESHOLD = 34000;

    if (provisionalIncome <= TIER1_THRESHOLD) return 0;
    if (provisionalIncome <= TIER2_THRESHOLD) return 0.5;
    return 0.85;
  }

  // Married Filing Jointly: use $32k/$44k thresholds
  if (filingStatus === 'married-joint') {
    const TIER1_THRESHOLD = 32000;
    const TIER2_THRESHOLD = 44000;

    if (provisionalIncome <= TIER1_THRESHOLD) return 0;
    if (provisionalIncome <= TIER2_THRESHOLD) return 0.5;
    return 0.85;
  }

  // Fallback (should not reach)
  return 0.85;
}

/**
 * Computes the taxable portion of Social Security benefits.
 *
 * @param annualSSBenefit - Annual SS benefit received
 * @param provisionalIncome - Computed provisional income
 * @param filingStatus - Filing status
 * @returns Amount of SS benefit subject to federal income tax
 *
 * @example
 * // MFJ, $25k annual benefit, PI = $50k → 85% taxable
 * computeTaxableSS(25000, 50000, 'married-joint') // $21,250
 */
export function computeTaxableSS(
  annualSSBenefit: number,
  provisionalIncome: number,
  filingStatus: FilingStatus,
): number {
  const fraction = computeSSTaxableFraction(provisionalIncome, filingStatus);
  return annualSSBenefit * fraction;
}

/**
 * Determines which tier of SS taxation applies (for display/logging).
 *
 * @param provisionalIncome - Computed provisional income
 * @param filingStatus - Filing status
 * @returns Tier number (1, 2, or 3) or -1 for MFS (all tier 3)
 */
export function getSSTaxationTier(provisionalIncome: number, filingStatus: FilingStatus): 1 | 2 | 3 {
  const fraction = computeSSTaxableFraction(provisionalIncome, filingStatus);
  if (fraction === 0) return 1;
  if (fraction === 0.5) return 2;
  return 3;
}

/**
 * Detailed SS taxation result for a single year.
 */
export interface SSTaxationResult {
  annualSSBenefit: number;
  provisionalIncome: number;
  taxableFraction: 0 | 0.5 | 0.85;
  taxableBenefit: number;
  tier: 1 | 2 | 3;
}

/**
 * Full SS taxation computation.
 *
 * @param agi - AGI (non-SS income)
 * @param taxExemptInterest - Non-taxable interest
 * @param annualSSBenefit - Annual SS benefit
 * @param filingStatus - Filing status
 * @returns Detailed result
 */
export function computeSSBenefitTaxation(
  agi: number,
  taxExemptInterest: number,
  annualSSBenefit: number,
  filingStatus: FilingStatus,
): SSTaxationResult {
  const provisionalIncome = computeProvisionalIncome(agi, taxExemptInterest, annualSSBenefit);
  const taxableFraction = computeSSTaxableFraction(provisionalIncome, filingStatus);
  const taxableBenefit = annualSSBenefit * taxableFraction;
  const tier = getSSTaxationTier(provisionalIncome, filingStatus);

  return {
    annualSSBenefit,
    provisionalIncome,
    taxableFraction,
    taxableBenefit,
    tier,
  };
}
