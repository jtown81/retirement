/**
 * Social Security Benefit Taxation Module
 *
 * Determines what portion of Social Security benefits are subject to federal income tax.
 * Uses the provisional income test per IRC § 86 and IRS Publication 915.
 *
 * Source: IRC § 86; IRS Pub. 915; SSA.gov
 *
 * TAXATION RULES:
 * - If provisional income ≤ lower threshold: 0% of SS is taxable
 * - If provisional income ≤ upper threshold: up to 50% of SS above lower threshold
 * - If provisional income > upper threshold: up to 85% of SS above upper threshold
 *
 * Provisional Income = AGI + nontaxable interest + 50% of Social Security
 *
 * THRESHOLDS (2024+):
 * - Single: $25,000 (lower), $34,000 (upper)
 * - Married filing jointly: $32,000 (lower), $44,000 (upper)
 * - Married filing separately: $0 (lower threshold; nearly all SS taxable)
 *
 * ASSUMPTION: Thresholds are indexed annually to inflation but have remained stable
 * since 1983/1984. Not adjusted further in this implementation (conservative).
 */

import type { USD } from '../../models/common';
import type { FilingStatus } from '../../models/tax';

interface SSThresholds {
  lower: USD;
  upper: USD;
}

const SS_THRESHOLDS: Record<FilingStatus, SSThresholds> = {
  single: { lower: 25000, upper: 34000 },
  married_joint: { lower: 32000, upper: 44000 },
  married_separate: { lower: 0, upper: 0 },
  head_of_household: { lower: 25000, upper: 34000 },
};

/**
 * Computes provisional income for Social Security taxation per IRC § 86.
 *
 * Provisional Income = AGI + Nontaxable Interest + 50% of Gross Social Security
 *
 * For simplicity, "AGI" here means ordinaryIncome (which includes annuity + trad TSP withdrawal
 * + any other taxable income, minus standard deduction for this formula).
 * We ignore nontaxable municipal bond interest (assumed $0 for federal employees).
 *
 * @param agi - Adjusted Gross Income (ordinary income before SS adjustment)
 * @param grossSocialSecurity - Total Social Security benefit (before tax)
 * @returns Provisional income amount
 */
export function computeSSProvisionalIncome(agi: USD, grossSocialSecurity: USD): USD {
  return agi + 0.5 * grossSocialSecurity;
}

/**
 * Determines the taxable fraction of Social Security benefits.
 *
 * Returns one of three tiers (0%, 50%, or 85%) based on provisional income relative to
 * filing-status-specific thresholds.
 *
 * @param provisionalIncome - Provisional income from computeSSProvisionalIncome()
 * @param filingStatus - Filing status
 * @returns Taxable fraction: 0.0, 0.5, or 0.85
 */
export function computeSSTaxableFraction(
  provisionalIncome: USD,
  filingStatus: FilingStatus
): 0 | 0.5 | 0.85 {
  const thresholds = SS_THRESHOLDS[filingStatus];

  if (provisionalIncome <= thresholds.lower) {
    // Tier 1: No Social Security is taxable
    return 0;
  }

  if (provisionalIncome <= thresholds.upper) {
    // Tier 2: Up to 50% is taxable
    return 0.5;
  }

  // Tier 3: Up to 85% is taxable
  return 0.85;
}

/**
 * Computes the taxable amount of Social Security benefits.
 *
 * The calculation is complex because:
 * - Up to 50% of SS can be taxed in Tier 2
 * - Up to 85% of SS can be taxed in Tier 3
 * - These are overlapping caps, not simple percentages
 *
 * Simplified formula used here:
 *   If fraction = 0: taxable = 0
 *   If fraction = 0.5: taxable = min(50% of SS, 50% of PI above lower threshold)
 *   If fraction = 0.85: taxable = min(85% of SS, 85% of PI above upper threshold + 50% above lower)
 *
 * For most retirees, we use the simpler approach:
 *   taxable = fraction × grossSocialSecurity
 *
 * This is a conservative approximation (slightly overstates tax in some cases).
 *
 * @param provisionalIncome - Provisional income
 * @param grossSocialSecurity - Gross Social Security amount
 * @param filingStatus - Filing status
 * @returns Amount of Social Security subject to federal income tax
 */
export function computeSSTaxableAmount(
  provisionalIncome: USD,
  grossSocialSecurity: USD,
  filingStatus: FilingStatus
): USD {
  const fraction = computeSSTaxableFraction(provisionalIncome, filingStatus);
  const thresholds = SS_THRESHOLDS[filingStatus];

  if (fraction === 0) {
    return 0;
  }

  if (fraction === 0.5) {
    // Tier 2: up to 50% of SS, but limited to 50% of PI above lower threshold
    const excessPI = Math.max(0, provisionalIncome - thresholds.lower);
    const tier2Cap = excessPI * 0.5;
    const maxTaxable = grossSocialSecurity * 0.5;
    return Math.min(maxTaxable, tier2Cap);
  }

  // Tier 3 (fraction === 0.85)
  // Taxable = min(85% of SS, combined limits from both tiers)
  // Simplified: taxable = 0.85 × SS (conservative for most retirees)
  return grossSocialSecurity * 0.85;
}
